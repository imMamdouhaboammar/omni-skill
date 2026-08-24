import { describe, expect, it } from "bun:test";
import { parseSkillMarkdown } from "../src/core/parser";

describe("parseSkillMarkdown", () => {
  it("should correctly parse valid YAML frontmatter and markdown body", () => {
    const raw = `---
name: my-sample-skill
description: A great test skill.
---

# My Sample Skill
Body content here.`;

    const res = parseSkillMarkdown(raw);
    expect(res.frontmatter.name).toBe("my-sample-skill");
    expect(res.frontmatter.description).toBe("A great test skill.");
    expect(res.body).toContain("# My Sample Skill");
  });

  it("should throw on missing frontmatter", () => {
    expect(() => parseSkillMarkdown("# No frontmatter")).toThrow();
  });
});
