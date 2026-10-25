import { SkillFrontmatter, SkillManifest } from "./types";
import { parse as parseYaml } from "yaml";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function parseSkillMarkdown(content: string): { frontmatter: SkillFrontmatter; body: string } {
  let normalized = content;
  if (normalized.charCodeAt(0) === 0xfeff) {
    normalized = normalized.slice(1);
  }

  if (!normalized.startsWith("---\n") && !normalized.startsWith("---\r\n")) {
    throw new Error("Missing YAML frontmatter delimiters at the start of SKILL.md");
  }

  const openOffset = normalized.startsWith("---\r\n") ? 5 : 4;
  const rest = normalized.slice(openOffset);

  const closingMatch = rest.match(/(?:^|\r?\n)---(?:\r?\n|$)/);
  if (!closingMatch || closingMatch.index === undefined) {
    throw new Error("Unclosed YAML frontmatter block in SKILL.md");
  }

  const rawYamlEnd = openOffset + closingMatch.index;
  const rawYaml = normalized.slice(openOffset, rawYamlEnd);

  const bodyStart = openOffset + closingMatch.index + closingMatch[0].length;
  const body = normalized.slice(bodyStart).trim();
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
