import { ValidationFinding, ValidationResult } from "./types";
import { parseSkillMarkdown } from "./parser";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SECRET_REGEX = /(sk-[A-Za-z0-9_-]{16,}|ANTHROPIC_API_KEY\s*=|OPENAI_API_KEY\s*=|BEGIN (?:RSA |EC )?PRIVATE KEY)/;
const PERSONAL_PATH_REGEX = /(\/(?:Users|home)\/[^\s/]+|[A-Za-z]:[/\\]+(?:Users|home)[/\\]+[^\s/\\]+)/;

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

  try {
    const { frontmatter } = parseSkillMarkdown(content);
    if (!frontmatter.name || !NAME_REGEX.test(frontmatter.name)) {
      findings.push({
        severity: "error",
        code: "INVALID_NAME",
        message: `Name "${frontmatter.name}" is invalid. Must be lowercase kebab-case.`
      });
    }

    if (!frontmatter.description || frontmatter.description.trim().length === 0) {
      findings.push({
        severity: "error",
        code: "EMPTY_DESCRIPTION",
        message: "Frontmatter description cannot be empty."
      });
    }
  } catch (err: any) {
    findings.push({
      severity: "error",
      code: "YAML_PARSE_ERROR",
      message: err.message
    });
  }

  if (lines.length > 500) {
    findings.push({
      severity: "warning",
      code: "BODY_LARGE",
      message: `SKILL.md has ${lines.length} lines. Best practice is <500 lines.`
    });
  }

  // Scan recursive files for secrets or personal paths
  function walk(dir: string) {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "__pycache__" || entry === "node_modules") continue;
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
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
    }
  }

  try {
    walk(skillDir);
  } catch {}

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
