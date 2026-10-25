import { SkillFrontmatter, SkillManifest } from "./types";
import { parse as parseYaml } from "yaml";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export class FrontmatterTypeError extends Error {
  code = "FRONTMATTER_TYPE";
  constructor(message: string) {
    super(message);
    this.name = "FrontmatterTypeError";
  }
}

export function validateFrontmatterTypes(data: unknown): asserts data is SkillFrontmatter {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new FrontmatterTypeError("YAML frontmatter must be a key-value mapping");
  }

  const record = data as Record<string, unknown>;

  if (!("name" in record) || record.name === undefined || record.name === null) {
    throw new FrontmatterTypeError("Frontmatter field 'name' is required");
  }
  if (typeof record.name !== "string") {
    const receivedType = Array.isArray(record.name) ? "array" : typeof record.name;
    throw new FrontmatterTypeError(`Frontmatter field 'name' must be a string, received ${receivedType}`);
  }

  if (!("description" in record) || record.description === undefined || record.description === null) {
    throw new FrontmatterTypeError("Frontmatter field 'description' is required");
  }
  if (typeof record.description !== "string") {
    const receivedType = Array.isArray(record.description) ? "array" : typeof record.description;
    throw new FrontmatterTypeError(`Frontmatter field 'description' must be a string, received ${receivedType}`);
  }

  if ("version" in record && typeof record.version !== "string") {
    const receivedType = record.version === null ? "null" : typeof record.version;
    throw new FrontmatterTypeError(`Frontmatter field 'version' must be a string, received ${receivedType}`);
  }

  if ("author" in record && typeof record.author !== "string") {
    const receivedType = record.author === null ? "null" : typeof record.author;
    throw new FrontmatterTypeError(`Frontmatter field 'author' must be a string, received ${receivedType}`);
  }
}

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

  let parsed: unknown;
  try {
    parsed = parseYaml(rawYaml);
  } catch (err: any) {
    throw new Error(`YAML syntax error in frontmatter: ${err.message}`);
  }

  validateFrontmatterTypes(parsed);
  const frontmatter = parsed as SkillFrontmatter;

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
