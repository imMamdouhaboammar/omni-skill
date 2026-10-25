import { describe, expect, it } from "bun:test";
import { validateSkillDirectory } from "../src/core/validator";
import { chmodSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("validateSkillDirectory - Root and Read Failures (Issue #3)", () => {
  it("fails closed gracefully when SKILL.md is unreadable instead of throwing an unhandled exception", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-unreadable-root-md-"));
    const skillMd = join(dir, "SKILL.md");
    writeFileSync(
      skillMd,
      `---
name: unreadable-skill
description: Tests unreadable SKILL.md fail closed.
---
# Why This Skill Is Needed
Target State
`
    );
    chmodSync(skillMd, 0o000);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      expect(result.errors).toBe(1);
      const readFailure = result.findings.find((f) => f.code === "READ_FAILURE");
      expect(readFailure).toBeDefined();
      expect(readFailure?.severity).toBe("error");
      // Message must not leak absolute filesystem path
      expect(readFailure?.message).not.toContain(dir);
      expect(readFailure?.message).toContain("SKILL.md");
    } finally {
      chmodSync(skillMd, 0o644);
      rmSync(dir, { recursive: true });
    }
  });

  it("fails closed when skill root directory does not exist", () => {
    const nonExistent = join(tmpdir(), "omni-non-existent-dir-" + Date.now());
    const result = validateSkillDirectory(nonExistent);
    expect(result.pass).toBe(false);
    expect(result.errors).toBe(1);
    const finding = result.findings.find((f) => f.code === "INVALID_ROOT" || f.code === "READ_FAILURE");
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe("error");
  });

  it("fails closed when skill root is a regular file instead of a directory", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-file-root-"));
    const filePath = join(dir, "some-file.txt");
    writeFileSync(filePath, "not a directory");

    try {
      const result = validateSkillDirectory(filePath);
      expect(result.pass).toBe(false);
      expect(result.errors).toBe(1);
      const finding = result.findings.find((f) => f.code === "INVALID_ROOT");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("error");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("fails closed when skill root is a symbolic link", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-symlink-root-"));
    const realSkill = join(dir, "real-skill");
    mkdtempSync(realSkill);
    const symlinkPath = join(dir, "symlink-skill");
    symlinkSync(realSkill, symlinkPath);

    try {
      const result = validateSkillDirectory(symlinkPath);
      expect(result.pass).toBe(false);
      expect(result.errors).toBe(1);
      const finding = result.findings.find((f) => f.code === "READ_FAILURE");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("error");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("fails closed when skill root directory is unreadable (EACCES)", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-unreadable-root-dir-"));
    chmodSync(dir, 0o000);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      expect(result.errors).toBe(1);
      const finding = result.findings.find((f) => f.code === "READ_FAILURE");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("error");
    } finally {
      chmodSync(dir, 0o755);
      rmSync(dir, { recursive: true });
    }
  });

  it("fails closed with MISSING_SKILL_MD when skill directory is completely empty", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-empty-dir-"));
    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      expect(result.errors).toBe(1);
      const finding = result.findings.find((f) => f.code === "MISSING_SKILL_MD");
      expect(finding).toBeDefined();
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("fails closed with READ_FAILURE when SKILL.md is a symlink pointing to an unreadable file", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-symlink-unreadable-"));
    const realTarget = join(dir, "target.md");
    writeFileSync(realTarget, "# Target");
    chmodSync(realTarget, 0o000);
    const symlinkFile = join(dir, "SKILL.md");
    symlinkSync(realTarget, symlinkFile);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      expect(result.errors).toBe(1);
      const finding = result.findings.find((f) => f.code === "READ_FAILURE");
      expect(finding).toBeDefined();
    } finally {
      chmodSync(realTarget, 0o644);
      rmSync(dir, { recursive: true });
    }
  });

  it("does not leak user personal directory in broken relative links", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-relative-link-hygiene-"));
    const skillMd = join(dir, "SKILL.md");
    writeFileSync(
      skillMd,
      `---
name: relative-link-hygiene
description: Testing links.
---
# Why This Skill Is Needed
Target State

See [Secret Doc](../outside-secret.md)
`
    );

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      const linkFinding = result.findings.find((f) => f.code === "BROKEN_RELATIVE_LINK");
      expect(linkFinding).toBeDefined();
      expect(linkFinding?.message).not.toContain("/Users/");
      expect(linkFinding?.message).not.toContain("/home/");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("accumulates errors correctly and ensures pass is false when multiple distinct failures exist", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-multiple-distinct-"));
    const skillMd = join(dir, "SKILL.md");
    writeFileSync(
      skillMd,
      `---
name: Invalid_Name
description: Testing multi-error.
---
# Why This Skill Is Needed
Target State

See [broken](non-existent.md)
`
    );
    const unreadFile = join(dir, "unreadable.md");
    writeFileSync(unreadFile, "unreadable");
    chmodSync(unreadFile, 0o000);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      // INVALID_NAME + BROKEN_RELATIVE_LINK + READ_FAILURE
      expect(result.errors).toBe(3);
      expect(result.findings.some((f) => f.code === "INVALID_NAME")).toBe(true);
      expect(result.findings.some((f) => f.code === "BROKEN_RELATIVE_LINK")).toBe(true);
      expect(result.findings.some((f) => f.code === "READ_FAILURE")).toBe(true);
    } finally {
      chmodSync(unreadFile, 0o644);
      rmSync(dir, { recursive: true });
    }
  });
});
