import { SkillFrontmatter, SkillManifest } from "./types";
import { parse as parseYaml } from "yaml";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function parseSkillMarkdown(content: string): { frontmatter: SkillFrontmatter; body: string } {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) {
    throw new Error("Missing YAML frontmatter delimiters at the start of SKILL.md");
  }

  const endIndex = content.indexOf("\n---", 4);
  if (endIndex === -1) {
    throw new Error("Unclosed YAML frontmatter block in SKILL.md");
  }

  const rawYaml = content.slice(4, endIndex);
  const body = content.slice(endIndex + 4).trim();
  const frontmatter = parseYaml(rawYaml) as SkillFrontmatter;

  if (!frontmatter || typeof frontmatter !== "object") {
    throw new Error("Invalid YAML structure in frontmatter");
  }

  return { frontmatter, body };
}

export function loadSkillDirectory(skillDir: string): SkillManifest {
  const skillFile = join(skillDir, "SKILL.md");
  if (!existsSync(skillFile)) {
    throw new Error(`SKILL.md not found in directory: ${skillDir}`);
  }

  const content = readFileSync(skillFile, "utf-8");
  const { frontmatter } = parseSkillMarkdown(content);
  const lineCount = content.split("\n").length;

  return {
    name: frontmatter.name,
    frontmatter,
    content,
    lineCount,
    hasReferences: existsSync(join(skillDir, "references")),
    hasScripts: existsSync(join(skillDir, "scripts")),
    hasEvals: existsSync(join(skillDir, "evals"))
  };
}
