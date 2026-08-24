import { describe, expect, it } from "bun:test";
import { compileOmniSkillSpec } from "../src/core/compiler";
import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("compileOmniSkillSpec", () => {
  it("should compile a spec into a valid directory with SKILL.md", () => {
    const outDir = mkdtempSync(join(tmpdir(), "omni-compile-"));
    const spec = {
      name: "generated-skill",
      description: "Auto generated skill description",
      job: "Does tasks automatically",
      instructions: ["Check environment", "Run action"],
      references: { "api-guide": "# API Guide\nDetails here." }
    };

    const res = compileOmniSkillSpec(spec, outDir);
    expect(existsSync(join(res, "SKILL.md"))).toBe(true);
    expect(existsSync(join(res, "references", "api-guide.md"))).toBe(true);
  });
});
