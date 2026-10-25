import { describe, expect, it } from "bun:test";
import { validateSkillDirectory } from "../src/core/validator";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("validateSkillDirectory - Adversarial System Edge Cases", () => {
  it("fails closed with READ_FAILURE when SKILL.md is a directory instead of a file", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-skillmd-dir-"));
    const skillMdDir = join(dir, "SKILL.md");
    mkdirSync(skillMdDir);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      expect(result.errors).toBe(1);
      const finding = result.findings.find((f) => f.code === "READ_FAILURE");
      expect(finding).toBeDefined();
      expect(finding?.message).toContain("SKILL.md");
      expect(finding?.message).not.toContain(dir);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("fails closed with READ_FAILURE when SKILL.md is a broken symlink", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-skillmd-symlink-"));
    const skillMdSymlink = join(dir, "SKILL.md");
    symlinkSync("target-non-existent.md", skillMdSymlink);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      expect(result.errors).toBe(1);
      const finding = result.findings.find((f) => f.code === "READ_FAILURE" || f.code === "MISSING_SKILL_MD");
      expect(finding).toBeDefined();
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("traverses 5 levels of nested directories to fail closed on deep unreadable leaf", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-deep-nested-"));
    writeFileSync(
      join(dir, "SKILL.md"),
      `---
name: deep-nested-skill
description: Tests deep traversal.
---
# Why This Skill Is Needed
Target State
`
    );
    const deepDir = join(dir, "level1", "level2", "level3", "level4", "level5");
    mkdirSync(deepDir, { recursive: true });
    const leafFile = join(deepDir, "unreadable.md");
    writeFileSync(leafFile, "leaf secret");
    chmodSync(leafFile, 0o000);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      expect(result.errors).toBe(1);
      const finding = result.findings.find((f) => f.code === "READ_FAILURE");
      expect(finding).toBeDefined();
      expect(finding?.message).toContain("level1/level2/level3/level4/level5/unreadable.md");
      expect(finding?.message).not.toContain(dir);
    } finally {
      chmodSync(leafFile, 0o644);
      rmSync(dir, { recursive: true });
    }
  });

  it("captures multiple unreadable sibling files in the same subdirectory", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-multi-unreadable-"));
    writeFileSync(
      join(dir, "SKILL.md"),
      `---
name: multi-unreadable-skill
description: Tests multiple unreadable siblings.
---
# Why This Skill Is Needed
Target State
`
    );
    const sub = join(dir, "sub");
    mkdirSync(sub);
    const fileA = join(sub, "a.md");
    const fileB = join(sub, "b.md");
    writeFileSync(fileA, "A");
    writeFileSync(fileB, "B");
    chmodSync(fileA, 0o000);
    chmodSync(fileB, 0o000);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      const readFailures = result.findings.filter((f) => f.code === "READ_FAILURE");
      expect(readFailures.length).toBe(2);
      expect(readFailures.some((f) => f.message.includes("sub/a.md"))).toBe(true);
      expect(readFailures.some((f) => f.message.includes("sub/b.md"))).toBe(true);
    } finally {
      chmodSync(fileA, 0o644);
      chmodSync(fileB, 0o644);
      rmSync(dir, { recursive: true });
    }
  });

  it("does not report READ_FAILURE for unreadable files inside ignored node_modules directory", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-ignored-node-modules-"));
    writeFileSync(
      join(dir, "SKILL.md"),
      `---
name: ignored-modules-skill
description: Tests ignored vendor directory.
---
# Why This Skill Is Needed
Target State
`
    );
    const nm = join(dir, "node_modules");
    mkdirSync(nm);
    const nmFile = join(nm, "vendor.js");
    writeFileSync(nmFile, "vendor code");
    chmodSync(nmFile, 0o000);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(true);
      expect(result.errors).toBe(0);
    } finally {
      chmodSync(nmFile, 0o644);
      rmSync(dir, { recursive: true });
    }
  });

  it("does not report READ_FAILURE for unreadable ignored test files", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-ignored-test-files-"));
    writeFileSync(
      join(dir, "SKILL.md"),
      `---
name: ignored-tests-skill
description: Tests ignored test files.
---
# Why This Skill Is Needed
Target State
`
    );
    const testFile = join(dir, "example.test.ts");
    writeFileSync(testFile, "test code");
    chmodSync(testFile, 0o000);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(true);
      expect(result.errors).toBe(0);
    } finally {
      chmodSync(testFile, 0o644);
      rmSync(dir, { recursive: true });
    }
  });

  it("safely ignores binary assets (.png, .jpg, .pyc) without throwing UTF-8 read failures", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-binary-assets-"));
    writeFileSync(
      join(dir, "SKILL.md"),
      `---
name: binary-assets-skill
description: Tests binary assets handling.
---
# Why This Skill Is Needed
Target State
`
    );
    // Write arbitrary non-UTF8 binary data
    const nonUtf8Bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    writeFileSync(join(dir, "icon.png"), nonUtf8Bytes);
    writeFileSync(join(dir, "banner.jpg"), nonUtf8Bytes);
    writeFileSync(join(dir, "cache.pyc"), nonUtf8Bytes);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(true);
      expect(result.errors).toBe(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("inspects extensionless text files (e.g. CREDENTIALS) for secrets", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-extensionless-"));
    writeFileSync(
      join(dir, "SKILL.md"),
      `---
name: extensionless-skill
description: Tests extensionless text files.
---
# Why This Skill Is Needed
Target State
`
    );
    writeFileSync(join(dir, "CREDENTIALS"), "ANTHROPIC_API_KEY = sk-ant-api03-1234567890123456");

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      expect(result.errors).toBe(1);
      const leak = result.findings.find((f) => f.code === "SECRET_LEAK");
      expect(leak).toBeDefined();
      expect(leak?.message).toContain("CREDENTIALS");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("safely ignores unreadable hidden dotfiles and dotdirectories (e.g. .git)", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-unreadable-hidden-"));
    writeFileSync(
      join(dir, "SKILL.md"),
      `---
name: unreadable-hidden-skill
description: Tests unreadable hidden items.
---
# Why This Skill Is Needed
Target State
`
    );
    const hiddenDir = join(dir, ".git");
    mkdirSync(hiddenDir);
    chmodSync(hiddenDir, 0o000);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(true);
      expect(result.errors).toBe(0);
    } finally {
      chmodSync(hiddenDir, 0o755);
      rmSync(dir, { recursive: true });
    }
  });

  it("produces BODY_LARGE warning when SKILL.md exceeds 500 lines without failing", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-large-skill-"));
    const lines = [
      "---",
      "name: large-skill",
      "description: Tests large skill file.",
      "---",
      "# Why This Skill Is Needed",
      "Target State"
    ];
    for (let i = 0; i < 510; i++) {
      lines.push(`Line content ${i}`);
    }
    writeFileSync(join(dir, "SKILL.md"), lines.join("\n"));

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(true);
      expect(result.errors).toBe(0);
      expect(result.warnings).toBeGreaterThan(0);
      const bodyWarn = result.findings.find((f) => f.code === "BODY_LARGE");
      expect(bodyWarn).toBeDefined();
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("produces ANTI_SLOP_DEV_NOTES warning when internal developer notes are found", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-anti-slop-"));
    writeFileSync(
      join(dir, "SKILL.md"),
      `---
name: anti-slop-skill
description: Tests anti-slop detection.
---
# Why This Skill Is Needed
Target State

TODO: finish the actual instructions.
`
    );

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(true);
      expect(result.errors).toBe(0);
      const slopWarn = result.findings.find((f) => f.code === "ANTI_SLOP_DEV_NOTES");
      expect(slopWarn).toBeDefined();
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
