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
});
