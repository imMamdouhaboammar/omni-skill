import { describe, expect, it } from "bun:test";
import { validateSkillDirectory } from "../src/core/validator";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("validateSkillDirectory - Traversal Hygiene and Path Sanitization (Issue #3)", () => {
  it("sanitizes relative path and error code when a subdirectory cannot be scanned", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-unreadable-subdir-"));
    const skillMd = join(dir, "SKILL.md");
    writeFileSync(
      skillMd,
      `---
name: unreadable-sub-skill
description: Tests unreadable subdirectory.
---
# Why This Skill Is Needed
Target State
`
    );
    const subDir = join(dir, "forbidden-sub");
    mkdirSync(subDir);
    chmodSync(subDir, 0o000);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      expect(result.errors).toBe(1);
      const finding = result.findings.find((f) => f.code === "READ_FAILURE");
      expect(finding).toBeDefined();
      expect(finding?.message).toContain("forbidden-sub");
      expect(finding?.message).not.toContain(dir);
      expect(finding?.message).not.toContain("/Users/");
    } finally {
      chmodSync(subDir, 0o755);
      rmSync(dir, { recursive: true });
    }
  });

  it("sanitizes symbolic link findings without leaking absolute paths", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-symlink-hygiene-"));
    const skillMd = join(dir, "SKILL.md");
    writeFileSync(
      skillMd,
      `---
name: symlink-hygiene-skill
description: Tests symlink hygiene.
---
# Why This Skill Is Needed
Target State
`
    );
    const symlinkPath = join(dir, "nested-link.txt");
    symlinkSync("target-does-not-exist.txt", symlinkPath);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      expect(result.errors).toBe(1);
      const finding = result.findings.find((f) => f.code === "READ_FAILURE");
      expect(finding).toBeDefined();
      expect(finding?.message).toContain("nested-link.txt");
      expect(finding?.message).not.toContain(dir);
      expect(finding?.message).not.toContain("/Users/");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("sanitizes nested file read failures without leaking error stack or absolute paths", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-nested-read-fail-"));
    const skillMd = join(dir, "SKILL.md");
    writeFileSync(
      skillMd,
      `---
name: nested-read-skill
description: Tests nested file read failure.
---
# Why This Skill Is Needed
Target State
`
    );
    const secretDir = join(dir, "sub");
    mkdirSync(secretDir);
    const unreadFile = join(secretDir, "unreadable.md");
    writeFileSync(unreadFile, "unreadable content");
    chmodSync(unreadFile, 0o000);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      expect(result.errors).toBe(1);
      const finding = result.findings.find((f) => f.code === "READ_FAILURE");
      expect(finding).toBeDefined();
      expect(finding?.message).toContain("sub/unreadable.md");
      expect(finding?.message).not.toContain(dir);
      expect(finding?.message).not.toContain("/Users/");
    } finally {
      chmodSync(unreadFile, 0o644);
      rmSync(dir, { recursive: true });
    }
  });

  it("continues scanning sibling entries when one entry fails to read", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-scan-continue-"));
    const skillMd = join(dir, "SKILL.md");
    writeFileSync(
      skillMd,
      `---
name: sibling-scan-skill
description: Tests sibling scanning continuity.
---
# Why This Skill Is Needed
Target State
`
    );
    // a-broken: symlink (READ_FAILURE)
    symlinkSync("missing.txt", join(dir, "a-broken.txt"));
    // b-unreadable: unreadable file (READ_FAILURE)
    const unreadable = join(dir, "b-unreadable.md");
    writeFileSync(unreadable, "unreadable");
    chmodSync(unreadable, 0o000);
    // c-leaky: has secret (SECRET_LEAK)
    writeFileSync(join(dir, "c-leaky.txt"), "OPENAI_API_KEY=sk-1234567890abcdef12345678");

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      // At least 2 READ_FAILUREs and 1 SECRET_LEAK
      const readFailures = result.findings.filter((f) => f.code === "READ_FAILURE");
      const secretLeaks = result.findings.filter((f) => f.code === "SECRET_LEAK");
      expect(readFailures.length).toBe(2);
      expect(secretLeaks.length).toBe(1);
      expect(result.errors).toBe(3);

      // Verify no absolute paths leaked in any finding
      for (const finding of result.findings) {
        expect(finding.message).not.toContain(dir);
      }
    } finally {
      chmodSync(unreadable, 0o644);
      rmSync(dir, { recursive: true });
    }
  });

  it("safely handles cyclic symlink pointing to parent directory without infinite recursion", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-cyclic-symlink-"));
    const skillMd = join(dir, "SKILL.md");
    writeFileSync(
      skillMd,
      `---
name: cyclic-skill
description: Tests cyclic symlink.
---
# Why This Skill Is Needed
Target State
`
    );
    const sub = join(dir, "sub");
    mkdirSync(sub);
    const cyclicLink = join(sub, "loop-to-parent");
    symlinkSync(dir, cyclicLink);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      expect(result.errors).toBe(1);
      const finding = result.findings.find((f) => f.code === "READ_FAILURE");
      expect(finding).toBeDefined();
      expect(finding?.message).toContain("sub/loop-to-parent");
      expect(finding?.message).not.toContain(dir);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("safely handles symlink pointing to an absolute path outside the skill directory", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-outside-symlink-"));
    const skillMd = join(dir, "SKILL.md");
    writeFileSync(
      skillMd,
      `---
name: outside-symlink-skill
description: Tests outside symlink.
---
# Why This Skill Is Needed
Target State
`
    );
    const outsideTarget = join(tmpdir(), "outside-secret-" + Date.now() + ".txt");
    writeFileSync(outsideTarget, "secret outside");
    const linkPath = join(dir, "link-to-outside");
    symlinkSync(outsideTarget, linkPath);

    try {
      const result = validateSkillDirectory(dir);
      expect(result.pass).toBe(false);
      expect(result.errors).toBe(1);
      const finding = result.findings.find((f) => f.code === "READ_FAILURE");
      expect(finding).toBeDefined();
      expect(finding?.message).toContain("link-to-outside");
      expect(finding?.message).not.toContain(dir);
      expect(finding?.message).not.toContain(outsideTarget);
    } finally {
      rmSync(outsideTarget, { force: true });
      rmSync(dir, { recursive: true });
    }
  });
});
