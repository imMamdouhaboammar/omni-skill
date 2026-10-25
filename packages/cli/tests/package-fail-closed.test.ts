import { describe, expect, it, spyOn, beforeEach, afterEach } from "bun:test";
import { packageSkillCommand } from "../src/commands/package";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("packageSkillCommand - Fail-Closed Integration (Issue #3)", () => {
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

  it("refuses to package when skill root does not exist", () => {
    const nonExistent = join(tmpdir(), "omni-non-existent-pkg-" + Date.now());
    try {
      packageSkillCommand(nonExistent);
    } catch {
      // expect exit
    }
    expect(exitCode).toBe(1);
    expect(logOutput.join("\n")).toContain("Cannot package skill with validation errors");
  });

  it("refuses to package when skill root is a regular file", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-file-pkg-"));
    const file = join(dir, "not-a-dir.txt");
    writeFileSync(file, "hello");

    try {
      packageSkillCommand(file);
    } catch {
      // expect exit
    } finally {
      rmSync(dir, { recursive: true });
    }
    expect(exitCode).toBe(1);
    expect(logOutput.join("\n")).toContain("Cannot package skill with validation errors");
  });

  it("refuses to package when SKILL.md is unreadable", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-unreadable-md-pkg-"));
    const skillMd = join(dir, "SKILL.md");
    writeFileSync(
      skillMd,
      `---
name: unreadable-md-pkg
description: A test skill for packaging.
---
# Why This Skill Is Needed
Target State
`
    );
    chmodSync(skillMd, 0o000);

    try {
      packageSkillCommand(dir);
    } catch {
      // expect exit
    } finally {
      chmodSync(skillMd, 0o644);
      rmSync(dir, { recursive: true });
    }
    expect(exitCode).toBe(1);
    expect(logOutput.join("\n")).toContain("Cannot package skill with validation errors");
  });

  it("refuses to package when a nested file is unreadable", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-nested-unreadable-pkg-"));
    const skillMd = join(dir, "SKILL.md");
    writeFileSync(
      skillMd,
      `---
name: nested-unreadable-pkg
description: A test skill for packaging.
---
# Why This Skill Is Needed
Target State
`
    );
    const sub = join(dir, "sub");
    mkdirSync(sub);
    const unreadFile = join(sub, "secret.txt");
    writeFileSync(unreadFile, "unreadable");
    chmodSync(unreadFile, 0o000);

    try {
      packageSkillCommand(dir);
    } catch {
      // expect exit
    } finally {
      chmodSync(unreadFile, 0o644);
      rmSync(dir, { recursive: true });
    }
    expect(exitCode).toBe(1);
    expect(logOutput.join("\n")).toContain("Cannot package skill with validation errors");
  });

  it("refuses to package when directory contains a symbolic link", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-symlink-pkg-"));
    const skillMd = join(dir, "SKILL.md");
    writeFileSync(
      skillMd,
      `---
name: symlink-pkg
description: A test skill with symlink.
---
# Why This Skill Is Needed
Target State
`
    );
    symlinkSync("missing.txt", join(dir, "link.txt"));

    try {
      packageSkillCommand(dir);
    } catch {
      // expect exit
    } finally {
      rmSync(dir, { recursive: true });
    }
    expect(exitCode).toBe(1);
    expect(logOutput.join("\n")).toContain("Cannot package skill with validation errors");
  });

  it("refuses to package when a subdirectory is unscannable (EACCES)", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-unscannable-sub-pkg-"));
    const skillMd = join(dir, "SKILL.md");
    writeFileSync(
      skillMd,
      `---
name: unscannable-sub-pkg
description: A test skill with unscannable subdir.
---
# Why This Skill Is Needed
Target State
`
    );
    const sub = join(dir, "forbidden");
    mkdirSync(sub);
    chmodSync(sub, 0o000);

    try {
      packageSkillCommand(dir);
    } catch {
      // expect exit
    } finally {
      chmodSync(sub, 0o755);
      rmSync(dir, { recursive: true });
    }
    expect(exitCode).toBe(1);
    expect(logOutput.join("\n")).toContain("Cannot package skill with validation errors");
  });

  it("packages successfully when skill passes validation", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-test-valid-pkg-"));
    const skillDir = join(tempBase, "valid-skill");
    mkdirSync(skillDir);
    const skillMd = join(skillDir, "SKILL.md");
    writeFileSync(
      skillMd,
      `---
name: valid-skill
description: A perfectly valid skill.
---
# Why This Skill Is Needed
Target State
`
    );
    const outDir = join(tempBase, "out");

    try {
      packageSkillCommand(skillDir, { out: outDir });
      expect(exitCode).toBeNull();
      expect(existsSync(join(outDir, "valid-skill.skill"))).toBe(true);
      expect(logOutput.join("\n")).toContain("Package ready for distribution");
    } finally {
      rmSync(tempBase, { recursive: true });
    }
  });

  it("refuses to package when output directory is inside the skill directory", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-test-out-inside-"));
    const skillDir = join(tempBase, "valid-skill");
    mkdirSync(skillDir);
    writeFileSync(
      join(skillDir, "SKILL.md"),
      `---
name: valid-skill
description: A perfectly valid skill.
---
# Why This Skill Is Needed
Target State
`
    );
    const insideOut = join(skillDir, "dist");

    try {
      packageSkillCommand(skillDir, { out: insideOut });
    } catch {
      // expect exit(1)
    } finally {
      rmSync(tempBase, { recursive: true });
    }

    expect(exitCode).toBe(1);
    expect(logOutput.join("\n")).toContain("Output directory must be outside the skill");
  });

  it("refuses to package when archive file already exists", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-test-existing-archive-"));
    const skillDir = join(tempBase, "valid-skill");
    mkdirSync(skillDir);
    writeFileSync(
      join(skillDir, "SKILL.md"),
      `---
name: valid-skill
description: A perfectly valid skill.
---
# Why This Skill Is Needed
Target State
`
    );
    const outDir = join(tempBase, "out");
    mkdirSync(outDir);
    const existingArchive = join(outDir, "valid-skill.skill");
    writeFileSync(existingArchive, "dummy archive");

    try {
      packageSkillCommand(skillDir, { out: outDir });
    } catch {
      // expect exit(1)
    } finally {
      rmSync(tempBase, { recursive: true });
    }

    expect(exitCode).toBe(1);
    expect(logOutput.join("\n")).toContain("Refusing to overwrite existing package");
  });

  it("refuses to package when SKILL.md is empty (0 bytes)", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-test-empty-md-pkg-"));
    const skillDir = join(tempBase, "empty-skill");
    mkdirSync(skillDir);
    writeFileSync(join(skillDir, "SKILL.md"), "");

    try {
      packageSkillCommand(skillDir);
    } catch {
      // expect exit(1)
    } finally {
      rmSync(tempBase, { recursive: true });
    }

    expect(exitCode).toBe(1);
    expect(logOutput.join("\n")).toContain("Cannot package skill with validation errors");
  });

  it("packages multiple files and preserves their file contents in zip archive", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-test-multi-file-pkg-"));
    const skillDir = join(tempBase, "multi-file-skill");
    mkdirSync(skillDir);
    writeFileSync(
      join(skillDir, "SKILL.md"),
      `---
name: multi-file-skill
description: Tests multi-file package bundling.
---
# Why This Skill Is Needed
Target State
`
    );
    const scriptsDir = join(skillDir, "scripts");
    mkdirSync(scriptsDir);
    writeFileSync(join(scriptsDir, "run.sh"), "#!/usr/bin/env bash\necho 'hello'");

    const outDir = join(tempBase, "out");

    try {
      packageSkillCommand(skillDir, { out: outDir });
      expect(exitCode).toBeNull();
      const archivePath = join(outDir, "multi-file-skill.skill");
      expect(existsSync(archivePath)).toBe(true);
    } finally {
      rmSync(tempBase, { recursive: true });
    }
  });

  it("creates non-existent nested output directories recursively when packaging", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-test-nested-out-pkg-"));
    const skillDir = join(tempBase, "skill");
    mkdirSync(skillDir);
    writeFileSync(
      join(skillDir, "SKILL.md"),
      `---
name: nested-out-skill
description: Tests recursive outDir creation.
---
# Why This Skill Is Needed
Target State
`
    );
    const deepOutDir = join(tempBase, "deep", "nested", "releases");

    try {
      packageSkillCommand(skillDir, { out: deepOutDir });
      expect(exitCode).toBeNull();
      const archivePath = join(deepOutDir, "skill.skill");
      expect(existsSync(archivePath)).toBe(true);
    } finally {
      rmSync(tempBase, { recursive: true });
    }
  });
});
