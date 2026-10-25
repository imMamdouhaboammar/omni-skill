import { OmniSkillSpec } from "./types";
import { mkdirSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

const NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REF_NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

  const refDir = join(targetDir, "references");

  // Preflight validation for references before creating any directories or writing files
  if (spec.references !== undefined && spec.references !== null) {
    if (typeof spec.references !== "object" || Array.isArray(spec.references)) {
      throw new TypeError(
        "Field 'references' must be a key-value object mapping reference names to markdown content."
      );
    }

    const seenRefKeys = new Set<string>();
    for (const [refName, refContent] of Object.entries(spec.references)) {
      if (typeof refName !== "string" || !REF_NAME_REGEX.test(refName)) {
        throw new Error(
          `Invalid reference name "${refName}". Reference keys must be lowercase kebab-case alphanumeric without file extensions.`
        );
      }

      const canonicalRefKey = refName.toLowerCase();
      if (seenRefKeys.has(canonicalRefKey)) {
        throw new Error(`Duplicate reference name detected: "${refName}".`);
      }
      seenRefKeys.add(canonicalRefKey);

      const targetRefFile = resolve(refDir, `${refName}.md`);
      const refRel = relative(refDir, targetRefFile);
      if (refRel.startsWith("..") || isAbsolute(refRel) || refRel !== `${refName}.md`) {
        throw new Error(
          `Path containment violation: Reference "${refName}" escapes references/ directory.`
        );
      }
    }
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

  if (spec.references && Object.keys(spec.references).length > 0) {
    mkdirSync(refDir, { recursive: true });
    for (const [refName, refContent] of Object.entries(spec.references)) {
      writeFileSync(join(refDir, `${refName}.md`), String(refContent), "utf-8");
    }
  }

  if (spec.evals && spec.evals.length > 0) {
    const evalDir = join(targetDir, "evals");
    mkdirSync(evalDir, { recursive: true });
    writeFileSync(join(evalDir, "evals.json"), JSON.stringify({ evals: spec.evals }, null, 2), "utf-8");
  }

  return targetDir;
}
