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
    expect(() => parseSkillMarkdown("# No frontmatter")).toThrow(
      "Missing YAML frontmatter delimiters at the start of SKILL.md"
    );
  });

  it("should correctly parse valid CRLF frontmatter and body", () => {
    const raw = "---\r\nname: crlf-skill\r\ndescription: CRLF skill.\r\n---\r\n\r\n# CRLF Body\r\nLine 2";
    const res = parseSkillMarkdown(raw);
    expect(res.frontmatter.name).toBe("crlf-skill");
    expect(res.frontmatter.description).toBe("CRLF skill.");
    expect(res.body).toBe("# CRLF Body\r\nLine 2");
  });

  it("should reject four-hyphen delimiter as closing boundary", () => {
    const raw = `---
name: four-hyphens
description: Testing invalid delimiter.
----
# Body`;
    expect(() => parseSkillMarkdown(raw)).toThrow(
      "Unclosed YAML frontmatter block in SKILL.md"
    );
  });

  it("should reject delimiter with trailing text as closing boundary", () => {
    const raw = `---
name: trailing-text
description: Testing trailing text.
---extra
# Body`;
    expect(() => parseSkillMarkdown(raw)).toThrow(
      "Unclosed YAML frontmatter block in SKILL.md"
    );
  });

  it("should reject delimiter with trailing whitespace as closing boundary", () => {
    const raw = `---
name: trailing-whitespace
description: Testing trailing whitespace.
---   
# Body`;
    expect(() => parseSkillMarkdown(raw)).toThrow(
      "Unclosed YAML frontmatter block in SKILL.md"
    );
  });

  it("should handle YAML content containing indented delimiter text without early closing", () => {
    const raw = `---
name: nested-delimiter
description: |
  Line 1
  ----
  ---note
  Line 2
---
# Real Body`;
    const res = parseSkillMarkdown(raw);
    expect(res.frontmatter.name).toBe("nested-delimiter");
    expect(res.frontmatter.description).toContain("Line 1");
    expect(res.frontmatter.description).toContain("----");
    expect(res.frontmatter.description).toContain("---note");
    expect(res.body).toBe("# Real Body");
  });

  it("should handle UTF-8 BOM before opening delimiter", () => {
    const raw = `\uFEFF---
name: bom-skill
description: Skill with BOM.
---
# Body`;
    const res = parseSkillMarkdown(raw);
    expect(res.frontmatter.name).toBe("bom-skill");
    expect(res.body).toBe("# Body");
  });

  it("should handle empty body after closing delimiter", () => {
    const raw = `---
name: empty-body
description: Skill without body.
---`;
    const res = parseSkillMarkdown(raw);
    expect(res.frontmatter.name).toBe("empty-body");
    expect(res.body).toBe("");
  });

  it("should throw deterministic error for unclosed frontmatter", () => {
    const raw = `---
name: unclosed-skill
description: Never closed.`;
    expect(() => parseSkillMarkdown(raw)).toThrow(
      "Unclosed YAML frontmatter block in SKILL.md"
    );
  });
});

