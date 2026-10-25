import { describe, expect, it, spyOn, beforeEach, afterEach } from "bun:test";
import { inspectSkillRoot, validateSkillCommand } from "../src/commands/validate";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("validateSkillCommand - CLI Fail-Closed Semantics (Issue #3)", () => {
  let logOutput: string[] = [];
  let exitCode: number | null = null;
  let logSpy: any;
  let exitSpy: any;

  beforeEach(() => {
    logOutput = [];
    exitCode = null;
    logSpy = spyOn(console, "log").mockImplementation((...args: any[]) => {
      logOutput.push(args.join(" "));
    });
    exitSpy = spyOn(process, "exit").mockImplementation(((code?: number) => {
      exitCode = code ?? 0;
      throw new Error(`PROCESS_EXIT_${code ?? 0}`);
    }) as any);
  });

  afterEach(() => {
    logSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("fails closed when explicit root does not exist", () => {
    const nonExistent = join(tmpdir(), "omni-non-existent-dir-xyz-" + Date.now());
    
    try {
      validateSkillCommand(nonExistent);
    } catch (e: any) {
      // expect process.exit(1)
    }

    expect(exitCode).toBe(1);
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("0/1 skills valid");
    expect(fullLog).toContain("1 errors");
    expect(fullLog).toContain("INVALID_ROOT");
  });

  it("fails closed when explicit root is a regular file", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-file-root-cmd-"));
    const filePath = join(dir, "skill-file.txt");
    writeFileSync(filePath, "regular file");

    try {
      validateSkillCommand(filePath);
    } catch (e: any) {
      // expect process.exit(1)
    } finally {
      rmSync(dir, { recursive: true });
    }

    expect(exitCode).toBe(1);
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("0/1 skills valid");
    expect(fullLog).toContain("1 errors");
    expect(fullLog).toContain("INVALID_ROOT");
  });

  it("fails closed when explicit root directory is inaccessible (EACCES)", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-unreadable-root-cmd-"));
    chmodSync(dir, 0o000);

    try {
      validateSkillCommand(dir);
    } catch (e: any) {
      // expect process.exit(1)
    } finally {
      chmodSync(dir, 0o755);
      rmSync(dir, { recursive: true });
    }

    expect(exitCode).toBe(1);
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("0/1 skills valid");
    expect(fullLog).toContain("1 errors");
    expect(fullLog).toContain("READ_FAILURE");
  });

  it("fails closed when multiple roots are passed and one is invalid", () => {
    const validDir = mkdtempSync(join(tmpdir(), "omni-test-valid-root-"));
    writeFileSync(
      join(validDir, "SKILL.md"),
      `---
name: valid-sample-skill
description: A valid sample skill.
---
# Why This Skill Is Needed
Target State
`
    );
    const nonExistent = join(tmpdir(), "omni-missing-root-multiple-" + Date.now());

    try {
      validateSkillCommand([validDir, nonExistent]);
    } catch (e: any) {
      // expect process.exit(1)
    } finally {
      rmSync(validDir, { recursive: true });
    }

    expect(exitCode).toBe(1);
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("1/2 skills valid");
    expect(fullLog).toContain("1 errors");
  });

  it("passes when all passed roots are valid skills", () => {
    const validDir1 = mkdtempSync(join(tmpdir(), "omni-test-valid-root1-"));
    writeFileSync(
      join(validDir1, "SKILL.md"),
      `---
name: valid-skill-one
description: First valid skill.
---
# Why This Skill Is Needed
Target State
`
    );
    const validDir2 = mkdtempSync(join(tmpdir(), "omni-test-valid-root2-"));
    writeFileSync(
      join(validDir2, "SKILL.md"),
      `---
name: valid-skill-two
description: Second valid skill.
---
# Why This Skill Is Needed
Target State
`
    );

    try {
      validateSkillCommand([validDir1, validDir2]);
    } finally {
      rmSync(validDir1, { recursive: true });
      rmSync(validDir2, { recursive: true });
    }

    expect(exitCode).toBeNull(); // Did not call process.exit(1)
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("2/2 skills valid (0 errors, 0 warnings)");
  });

  it("handles duplicate root paths accurately without corrupting totals", () => {
    const validDir = mkdtempSync(join(tmpdir(), "omni-test-duplicate-root-"));
    writeFileSync(
      join(validDir, "SKILL.md"),
      `---
name: duplicate-skill
description: Tests duplicate root invocation.
---
# Why This Skill Is Needed
Target State
`
    );

    try {
      validateSkillCommand([validDir, validDir]);
    } finally {
      rmSync(validDir, { recursive: true });
    }

    expect(exitCode).toBeNull();
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("2/2 skills valid (0 errors, 0 warnings)");
  });

  it("evaluates mixed valid and invalid roots accurately", () => {
    const validDir1 = mkdtempSync(join(tmpdir(), "omni-test-mixed-valid1-"));
    writeFileSync(
      join(validDir1, "SKILL.md"),
      `---
name: mixed-valid-one
description: First valid.
---
# Why This Skill Is Needed
Target State
`
    );
    const validDir2 = mkdtempSync(join(tmpdir(), "omni-test-mixed-valid2-"));
    writeFileSync(
      join(validDir2, "SKILL.md"),
      `---
name: mixed-valid-two
description: Second valid.
---
# Why This Skill Is Needed
Target State
`
    );
    const tempBase = mkdtempSync(join(tmpdir(), "omni-test-mixed-base-"));
    const fileRoot = join(tempBase, "a-file.txt");
    writeFileSync(fileRoot, "not a directory");
    const missingRoot = join(tempBase, "missing-dir");

    try {
      validateSkillCommand([validDir1, fileRoot, missingRoot, validDir2]);
    } catch {
      // expect exit(1)
    } finally {
      rmSync(validDir1, { recursive: true });
      rmSync(validDir2, { recursive: true });
      rmSync(tempBase, { recursive: true });
    }

    expect(exitCode).toBe(1);
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("2/4 skills valid (2 errors, 0 warnings)");
  });

  it("supports single string argument invocation", () => {
    const nonExistent = join(tmpdir(), "omni-single-string-missing-" + Date.now());
    try {
      validateSkillCommand(nonExistent);
    } catch {
      // expect exit(1)
    }
    expect(exitCode).toBe(1);
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("0/1 skills valid (1 errors, 0 warnings)");
  });

  it("supports root directory with trailing slash", () => {
    const validDir = mkdtempSync(join(tmpdir(), "omni-test-trailing-slash-"));
    writeFileSync(
      join(validDir, "SKILL.md"),
      `---
name: trailing-slash-skill
description: Tests trailing slash.
---
# Why This Skill Is Needed
Target State
`
    );

    try {
      validateSkillCommand(validDir + "/");
    } finally {
      rmSync(validDir, { recursive: true });
    }

    expect(exitCode).toBeNull();
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("1/1 skills valid (0 errors, 0 warnings)");
  });

  it("fails closed when explicit root is a symbolic link to a directory", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-test-symlink-root-cmd-"));
    const realDir = join(tempBase, "real-skill");
    mkdirSync(realDir);
    writeFileSync(
      join(realDir, "SKILL.md"),
      `---
name: real-symlinked-skill
description: Real skill.
---
# Why This Skill Is Needed
Target State
`
    );
    const symlinkRoot = join(tempBase, "symlink-root");
    symlinkSync(realDir, symlinkRoot);

    try {
      validateSkillCommand(symlinkRoot);
    } catch {
      // expect exit(1)
    } finally {
      rmSync(tempBase, { recursive: true });
    }

    expect(exitCode).toBe(1);
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("0/1 skills valid");
    expect(fullLog).toContain("1 errors");
    expect(fullLog).toContain("READ_FAILURE");
  });

  it("fails closed when explicit root is a broken symbolic link", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-test-broken-symlink-root-"));
    const brokenLink = join(tempBase, "broken-root-link");
    symlinkSync("target-does-not-exist", brokenLink);

    try {
      validateSkillCommand(brokenLink);
    } catch {
      // expect exit(1)
    } finally {
      rmSync(tempBase, { recursive: true });
    }

    expect(exitCode).toBe(1);
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("0/1 skills valid");
    expect(fullLog).toContain("1 errors");
  });

  it("fails closed when explicit root path is an empty string", () => {
    try {
      validateSkillCommand([""]);
    } catch {
      // expect exit(1)
    }

    expect(exitCode).toBe(1);
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("0/1 skills valid");
    expect(fullLog).toContain("1 errors");
    expect(fullLog).toContain("INVALID_ROOT");
  });

  it("fails closed when explicit root path is whitespace only", () => {
    try {
      validateSkillCommand(["   "]);
    } catch {
      // expect exit(1)
    }

    expect(exitCode).toBe(1);
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("0/1 skills valid");
    expect(fullLog).toContain("1 errors");
    expect(fullLog).toContain("INVALID_ROOT");
  });

  it("defaults to cwd and fails closed when called with empty array in an invalid skill directory", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "omni-test-empty-args-cwd-"));
    const originalCwd = process.cwd();

    try {
      process.chdir(tempDir);
      validateSkillCommand([]);
    } catch {
      // expect exit(1)
    } finally {
      process.chdir(originalCwd);
      rmSync(tempDir, { recursive: true });
    }

    expect(exitCode).toBe(1);
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("0/1 skills valid");
    expect(fullLog).toContain("1 errors");
    expect(fullLog).toContain("MISSING_SKILL_MD");
  });

  it("defaults to cwd and passes when called with empty array in a valid skill directory", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "omni-test-valid-cwd-"));
    writeFileSync(
      join(tempDir, "SKILL.md"),
      `---
name: valid-cwd-skill
description: Tests cwd default pass.
---
# Why This Skill Is Needed
Target State
`
    );
    const originalCwd = process.cwd();

    try {
      process.chdir(tempDir);
      validateSkillCommand([]);
    } finally {
      process.chdir(originalCwd);
      rmSync(tempDir, { recursive: true });
    }

    expect(exitCode).toBeNull();
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("1/1 skills valid (0 errors, 0 warnings)");
  });

  it("passes with exit 0 when skill has warnings but zero errors", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "omni-test-warning-only-"));
    // Missing why section and target state creates warnings, but no errors
    writeFileSync(
      join(tempDir, "SKILL.md"),
      `---
name: warning-only-skill
description: Tests warnings only.
---
# Simple Skill
Instructions here.
`
    );

    try {
      validateSkillCommand(tempDir);
    } finally {
      rmSync(tempDir, { recursive: true });
    }

    expect(exitCode).toBeNull(); // Did not exit 1
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("Validation PASSED");
    expect(fullLog).toContain("1/1 skills valid (0 errors, 2 warnings)");
  });

  it("fails with exit 1 when skill contains a secret leak", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "omni-test-secret-cmd-"));
    writeFileSync(
      join(tempDir, "SKILL.md"),
      `---
name: secret-leak-skill
description: Tests secret leak.
---
# Why This Skill Is Needed
Target State
`
    );
    writeFileSync(join(tempDir, "keys.env"), "OPENAI_API_KEY=sk-abcdef1234567890abcdef");

    try {
      validateSkillCommand(tempDir);
    } catch {
      // expect exit(1)
    } finally {
      rmSync(tempDir, { recursive: true });
    }

    expect(exitCode).toBe(1);
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("SECRET_LEAK");
    expect(fullLog).toContain("0/1 skills valid (1 errors, 0 warnings)");
  });

  it("reports granular error codes and exact summary counts across diverse root failures", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-test-diverse-roots-"));
    const missing = join(tempBase, "missing-root");
    const fileRoot = join(tempBase, "regular.txt");
    writeFileSync(fileRoot, "not a dir");
    const unreadableDir = join(tempBase, "forbidden-root");
    mkdirSync(unreadableDir);
    chmodSync(unreadableDir, 0o000);

    try {
      validateSkillCommand([missing, fileRoot, unreadableDir]);
    } catch {
      // expect exit(1)
    } finally {
      chmodSync(unreadableDir, 0o755);
      rmSync(tempBase, { recursive: true });
    }

    expect(exitCode).toBe(1);
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("0/3 skills valid (3 errors, 0 warnings)");
    expect(fullLog).toContain("INVALID_ROOT");
    expect(fullLog).toContain("READ_FAILURE");
  });

  it("fails closed and exits with code 1 if totalPassed is less than totalEvaluated", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-test-partial-pass-"));
    const valid = join(tempBase, "valid");
    mkdirSync(valid);
    writeFileSync(
      join(valid, "SKILL.md"),
      `---
name: valid-partial
description: Valid skill.
---
# Why This Skill Is Needed
Target State
`
    );
    const missing = join(tempBase, "missing");

    try {
      validateSkillCommand([valid, missing]);
    } catch {
      // expect exit(1)
    } finally {
      rmSync(tempBase, { recursive: true });
    }

    expect(exitCode).toBe(1);
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("1/2 skills valid");
  });

  it("handles mixed relative and absolute explicit paths sanitizing output correctly", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-test-mixed-rel-abs-"));
    const skillA = join(tempBase, "skill-a");
    mkdirSync(skillA);
    writeFileSync(
      join(skillA, "SKILL.md"),
      `---
name: skill-a
description: Skill A.
---
# Why This Skill Is Needed
Target State
`
    );
    const missingRel = "does-not-exist-relative-" + Date.now();

    try {
      validateSkillCommand([skillA, missingRel]);
    } catch {
      // expect exit(1)
    } finally {
      rmSync(tempBase, { recursive: true });
    }

    expect(exitCode).toBe(1);
    const fullLog = logOutput.join("\n");
    expect(fullLog).toContain("1/2 skills valid (1 errors, 0 warnings)");
    expect(fullLog).not.toMatch(/\/Users\/[a-zA-Z0-9_.-]+\//);
  });
});

describe("inspectSkillRoot", () => {
  it("returns ok: false with INVALID_ROOT for empty string", () => {
    const res = inspectSkillRoot("");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("INVALID_ROOT");
    }
  });

  it("returns ok: false with INVALID_ROOT for non-existent path", () => {
    const res = inspectSkillRoot("definitely-does-not-exist-" + Date.now());
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("INVALID_ROOT");
    }
  });

  it("returns ok: false with INVALID_ROOT for regular file", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-inspect-file-"));
    const file = join(dir, "doc.txt");
    writeFileSync(file, "hello");
    try {
      const res = inspectSkillRoot(file);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe("INVALID_ROOT");
      }
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("returns ok: true for existing directory", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-inspect-ok-"));
    try {
      const res = inspectSkillRoot(dir);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.skillPath).toBe(dir);
      }
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
