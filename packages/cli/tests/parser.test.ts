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

  describe("runtime frontmatter type validation", () => {
    it("should reject non-mapping YAML frontmatter (array at root)", () => {
      const raw = `---
- item 1
- item 2
---
# Body`;
      expect(() => parseSkillMarkdown(raw)).toThrow(
        /YAML frontmatter must be a key-value mapping/
      );
    });

    it("should reject frontmatter when required name is missing", () => {
      const raw = `---
description: Missing name field.
---
# Body`;
      expect(() => parseSkillMarkdown(raw)).toThrow(
        /Frontmatter field 'name' is required/
      );
    });

    it("should reject frontmatter when name is not a string (number)", () => {
      const raw = `---
name: 12345
description: Numeric name.
---
# Body`;
      expect(() => parseSkillMarkdown(raw)).toThrow(
        /Frontmatter field 'name' must be a string/
      );
    });

    it("should reject frontmatter when name is a boolean", () => {
      const raw = `---
name: true
description: Boolean name.
---
# Body`;
      expect(() => parseSkillMarkdown(raw)).toThrow(
        /Frontmatter field 'name' must be a string/
      );
    });

    it("should reject frontmatter when required description is missing", () => {
      const raw = `---
name: missing-desc
---
# Body`;
      expect(() => parseSkillMarkdown(raw)).toThrow(
        /Frontmatter field 'description' is required/
      );
    });

    it("should reject frontmatter when description is an array", () => {
      const raw = `---
name: array-desc
description:
  - line 1
  - line 2
---
# Body`;
      expect(() => parseSkillMarkdown(raw)).toThrow(
        /Frontmatter field 'description' must be a string/
      );
    });

    it("should reject frontmatter when description is an object", () => {
      const raw = `---
name: object-desc
description:
  subfield: value
---
# Body`;
      expect(() => parseSkillMarkdown(raw)).toThrow(
        /Frontmatter field 'description' must be a string/
      );
    });

    it("should reject frontmatter when description is null", () => {
      const raw = `---
name: null-desc
description: null
---
# Body`;
      expect(() => parseSkillMarkdown(raw)).toThrow(
        /Frontmatter field 'description' is required/
      );
    });

    it("should accept valid folded and multiline YAML descriptions", () => {
      const raw = `---
name: folded-desc
description: >
  This is a multiline
  folded description that spans
  several lines cleanly.
---
# Body`;
      const res = parseSkillMarkdown(raw);
      expect(res.frontmatter.name).toBe("folded-desc");
      expect(typeof res.frontmatter.description).toBe("string");
      expect(res.frontmatter.description).toContain("multiline");
    });

    it("should preserve valid optional metadata fields", () => {
      const raw = `---
name: metadata-skill
description: Skill with metadata.
version: "1.2.0"
author: "Test Author"
license: "MIT"
---
# Body`;
      const res = parseSkillMarkdown(raw);
      expect(res.frontmatter.name).toBe("metadata-skill");
      expect(res.frontmatter.version).toBe("1.2.0");
      expect(res.frontmatter.author).toBe("Test Author");
      expect((res.frontmatter as any).license).toBe("MIT");
    });
  });
});

