import { describe, expect, it } from "bun:test";
import { validateSkillDirectory } from "../src/core/validator";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("validateSkillDirectory", () => {
  it("should pass for valid skill structure", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-"));
    writeFileSync(
      join(dir, "SKILL.md"),
      `---
name: valid-skill
description: Valid description for agent.
---

# Valid Skill
Step 1.
`,
      "utf-8"
    );

    const report = validateSkillDirectory(dir);
    expect(report.pass).toBe(true);
    expect(report.errors).toBe(0);
  });

  it("should fail when name is not kebab-case", () => {
    const dir = mkdtempSync(join(tmpdir(), "omni-test-"));
    writeFileSync(
      join(dir, "SKILL.md"),
      `---
name: Invalid_Skill_Name
description: Some desc.
---
# Test
`,
      "utf-8"
    );

    const report = validateSkillDirectory(dir);
    expect(report.pass).toBe(false);
    expect(report.errors).toBeGreaterThan(0);
  });
});
