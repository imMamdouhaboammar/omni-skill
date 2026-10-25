import { ValidationFinding, ValidationResult } from "./types";
import { parseSkillMarkdown } from "./parser";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SECRET_REGEX = /(sk-[A-Za-z0-9_-]{16,}|ANTHROPIC_API_KEY\s*=|OPENAI_API_KEY\s*=|BEGIN (?:RSA |EC )?PRIVATE KEY)/;
const PERSONAL_PATH_REGEX = /(?:\/(?:Users|home)\/(?!(?:<[^>]+>|username|user))[a-zA-Z0-9_.-]+|[A-Za-z]:[/\\]+(?:Users|home)[/\\]+[^\s/\\]+)/;
const SLOP_DEV_NOTES_REGEX = /^\s*(TODO:|FIXME:|NOTE:\s*In production|Mock data displayed|Agent notice:)/im;
const SLOP_CEREMONIAL_PREAMBLE_REGEX = /^\s*(The following (?:table|section|list) (?:outlines|details|describes)|As an AI language model)/im;

/**
 * 7-Pass Autonomous Skill Validator conforming to AgentSkills.io v1,
 * Poteto Engineering Principles, and Anti-Slop quality standards.
 */
export function validateSkillDirectory(
  skillDir: string,
  targets: string[] = ["agent-skills", "chatgpt", "codex", "claude-code"]
): ValidationResult {
  const findings: ValidationFinding[] = [];
  const skillFile = join(skillDir, "SKILL.md");

  if (!existsSync(skillFile)) {
    return {
      skill: skillDir,
      targets,
      errors: 1,
      warnings: 0,
      findings: [{ severity: "error", code: "MISSING_SKILL_MD", message: "SKILL.md does not exist." }],
      pass: false
    };
  }

  const content = readFileSync(skillFile, "utf-8");
  const lines = content.split("\n");

  // Pass 1: Frontmatter Schema & Identity
  try {
    const { frontmatter } = parseSkillMarkdown(content);
    if (!frontmatter.name || !NAME_REGEX.test(frontmatter.name)) {
      findings.push({
        severity: "error",
        code: "INVALID_NAME",
        message: `Name "${frontmatter.name}" is invalid. Must be lowercase kebab-case.`
      });
    }

    if (frontmatter.description.trim().length === 0) {
      findings.push({
        severity: "error",
        code: "EMPTY_DESCRIPTION",
        message: "Frontmatter description cannot be empty."
      });
    }
  } catch (err: any) {
    const code = err.code || (err.name === "FrontmatterTypeError" ? "FRONTMATTER_TYPE" : "YAML_PARSE_ERROR");
    findings.push({
      severity: "error",
      code,
      message: err.message
    });
  }

  // Pass 2: Rationale & Target State Section
  const lowerContent = content.toLowerCase();
  const hasWhySection = lowerContent.includes("why this skill is needed") || content.includes("必要な理由");
  const hasTargetState = lowerContent.includes("target state") || content.includes("達成したい状態");
  if (!hasWhySection) {
    findings.push({
      severity: "warning",
      code: "MISSING_WHY_SECTION",
      message: "SKILL.md is missing 'Why This Skill Is Needed' rationale section."
    });
  }
  if (!hasTargetState) {
    findings.push({
      severity: "warning",
      code: "MISSING_TARGET_STATE",
      message: "SKILL.md is missing 'Target State' outcome section."
    });
  }

  // Pass 3: Markdown Relative Link Resolution
  const linkRegex = /\[([^\]]+)\]\((?!https?:\/\/|mailto:|#)([^)]+)\)/g;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(content)) !== null) {
    const rawTarget = linkMatch[2]?.split("#")[0]?.trim();
    if (rawTarget && rawTarget.length > 0) {
      const resolvedPath = resolve(skillDir, rawTarget);
      if (!existsSync(resolvedPath)) {
        findings.push({
          severity: "error",
          code: "BROKEN_RELATIVE_LINK",
          message: `Referenced file does not exist: "${rawTarget}"`
        });
      }
    }
  }

  // Pass 4: Line Budget Enforcement (<500 lines)
  if (lines.length > 500) {
    findings.push({
      severity: "warning",
      code: "BODY_LARGE",
      message: `SKILL.md has ${lines.length} lines. Best practice is <500 lines.`
    });
  }

  // Pass 5: Anti-Slop & Direct Payload Inspection
  if (SLOP_DEV_NOTES_REGEX.test(content)) {
    findings.push({
      severity: "warning",
      code: "ANTI_SLOP_DEV_NOTES",
      message: "Found internal developer notes (TODO/FIXME/Mock notes) in user-facing skill instructions."
    });
  }
  if (SLOP_CEREMONIAL_PREAMBLE_REGEX.test(content)) {
    findings.push({
      severity: "warning",
      code: "ANTI_SLOP_PREAMBLE",
      message: "Found ceremonial narrative preamble ('The following table outlines...'). Violates Direct Payload Invariant."
    });
  }

  // Pass 6 & 7: Recursive Secret and Personal Path Walk
  function walk(dir: string) {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch (err) {
      findings.push({ severity: "error", code: "READ_FAILURE", message: `Cannot scan directory ${dir}: ${String(err)}` });
      return;
    }
    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "__pycache__" || entry === "node_modules" || entry.startsWith("test_") || entry.endsWith(".test.ts") || entry.endsWith(".test.py")) continue;
      const fullPath = join(dir, entry);
      try {
        const stat = lstatSync(fullPath);
        if (stat.isSymbolicLink()) {
          findings.push({ severity: "error", code: "READ_FAILURE", message: `Cannot safely scan symbolic link: ${fullPath}` });
        } else if (stat.isDirectory()) {
          walk(fullPath);
        } else if (stat.isFile() && !entry.endsWith(".pyc") && !entry.endsWith(".png") && !entry.endsWith(".jpg")) {
          const text = readFileSync(fullPath, "utf-8");
          if (SECRET_REGEX.test(text)) {
            findings.push({
              severity: "error",
              code: "SECRET_LEAK",
              message: `Possible secret/token leak detected in ${entry}`
            });
          }
          if (PERSONAL_PATH_REGEX.test(text)) {
            findings.push({
              severity: "warning",
              code: "PERSONAL_PATH",
              message: `Personal absolute path detected in ${entry}`
            });
          }
        }
      } catch (err) {
        findings.push({ severity: "error", code: "READ_FAILURE", message: `Cannot scan ${fullPath}: ${String(err)}` });
      }
    }
  }

  walk(skillDir);

  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;

  return {
    skill: skillDir,
    targets,
    errors,
    warnings,
    findings,
    pass: errors === 0
  };
}
