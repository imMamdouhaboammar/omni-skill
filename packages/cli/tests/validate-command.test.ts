import { describe, expect, it, spyOn, beforeEach, afterEach } from "bun:test";
import { validateSkillCommand } from "../src/commands/validate";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
});
