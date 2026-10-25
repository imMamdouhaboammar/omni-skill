import { OmniSkillSpec } from "./types";
import { mkdirSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

const NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function compileOmniSkillSpec(spec: OmniSkillSpec, outputDir: string): string {
  if (!spec || typeof spec !== "object") {
    throw new TypeError("Skill specification must be an object.");
  }

  const name = spec.name;
  if (!name || typeof name !== "string") {
    throw new TypeError(`Skill name must be a non-empty string. Received: ${typeof name}`);
  }

  if (!NAME_REGEX.test(name)) {
    throw new Error(
      `Invalid skill name "${name}". Skill name must be lowercase kebab-case alphanumeric (e.g. "my-skill").`
    );
  }

  const resolvedOutput = resolve(outputDir);
  const targetDir = resolve(resolvedOutput, name);
  const rel = relative(resolvedOutput, targetDir);

  if (rel.startsWith("..") || isAbsolute(rel) || rel === "") {
    throw new Error(
      `Path containment violation: Skill name "${name}" escapes output directory "${outputDir}".`
    );
  }

  mkdirSync(targetDir, { recursive: true });

  const skillMdLines = [
    "---",
    `name: ${spec.name}`,
    "description: >",
    `  ${spec.description.trim()}`,
    "---",
    "",
    `# ${spec.name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`,
    "",
    `> ${spec.job}`,
    "",
    "## Invariant Guidelines",
    ""
  ];

  for (const step of spec.instructions) {
    skillMdLines.push(`- ${step}`);
  }

  skillMdLines.push(
    "",
    "## Host & Portability Contract",
    "",
    `- Target Hosts: ${(spec.target_hosts || ["agent-skills", "chatgpt", "codex", "claude-code"]).join(", ")}`,
    `- Freedom Level: ${spec.freedom_level || "medium"}`,
    ""
  );

  writeFileSync(join(targetDir, "SKILL.md"), skillMdLines.join("\n"), "utf-8");

  if (spec.references) {
    const refDir = join(targetDir, "references");
    mkdirSync(refDir, { recursive: true });
    for (const [refName, refContent] of Object.entries(spec.references)) {
      writeFileSync(join(refDir, `${refName}.md`), refContent, "utf-8");
    }
  }

  if (spec.evals && spec.evals.length > 0) {
    const evalDir = join(targetDir, "evals");
    mkdirSync(evalDir, { recursive: true });
    writeFileSync(join(evalDir, "evals.json"), JSON.stringify({ evals: spec.evals }, null, 2), "utf-8");
  }

  return targetDir;
}
