import { describe, expect, it, spyOn, beforeEach, afterEach } from "bun:test";
import { validateSkillCommand } from "../src/commands/validate";
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
});
