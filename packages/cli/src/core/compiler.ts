import { OmniSkillSpec } from "./types";
import { existsSync, lstatSync, mkdirSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

const NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REF_NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function compileOmniSkillSpec(spec: OmniSkillSpec, outputDir: string): string {
  if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
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

  if (
    spec.description === undefined ||
    spec.description === null ||
    typeof spec.description !== "string" ||
    spec.description.trim().length === 0
  ) {
    throw new (typeof spec.description !== "string" ? TypeError : Error)(
      "Field 'description' must be a non-empty string."
    );
  }

  if (
    spec.job === undefined ||
    spec.job === null ||
    typeof spec.job !== "string" ||
    spec.job.trim().length === 0
  ) {
    throw new (typeof spec.job !== "string" ? TypeError : Error)(
      "Field 'job' must be a non-empty string."
    );
  }

  if (!Array.isArray(spec.instructions) || spec.instructions.length === 0) {
    throw new (Array.isArray(spec.instructions) ? Error : TypeError)(
      "Field 'instructions' must be a non-empty array of non-empty strings."
    );
  }

  for (let i = 0; i < spec.instructions.length; i++) {
    const step = spec.instructions[i];
    if (typeof step !== "string" || step.trim().length === 0) {
      throw new (typeof step !== "string" ? TypeError : Error)(
        `Field 'instructions[${i}]' must be a non-empty string.`
      );
    }
  }

  if (spec.target_hosts !== undefined && spec.target_hosts !== null) {
    if (!Array.isArray(spec.target_hosts)) {
      throw new TypeError("Field 'target_hosts' must be an array of non-empty strings.");
    }
    for (let i = 0; i < spec.target_hosts.length; i++) {
      const host = spec.target_hosts[i];
      if (typeof host !== "string" || host.trim().length === 0) {
        throw new (typeof host !== "string" ? TypeError : Error)(
          `Field 'target_hosts[${i}]' must be a non-empty string.`
        );
      }
    }
  }

  if (spec.freedom_level !== undefined && spec.freedom_level !== null) {
    if (
      typeof spec.freedom_level !== "string" ||
      !["high", "medium", "low"].includes(spec.freedom_level)
    ) {
      throw new (typeof spec.freedom_level !== "string" ? TypeError : Error)(
        `Field 'freedom_level' must be one of 'high', 'medium', 'low'. Received: ${spec.freedom_level}`
      );
    }
  }

  const refDir = join(targetDir, "references");

  // Preflight validation for references before creating any directories or writing files
  let validatedReferences: Array<[string, string]> = [];
  if (spec.references !== undefined && spec.references !== null) {
    if (
      typeof spec.references !== "object" ||
      Array.isArray(spec.references) ||
      spec.references instanceof Map ||
      spec.references instanceof Set ||
      Object.prototype.toString.call(spec.references) !== "[object Object]"
    ) {
      throw new TypeError(
        "Field 'references' must be a key-value object mapping reference names to markdown content."
      );
    }

    if (existsSync(refDir) && lstatSync(refDir).isSymbolicLink()) {
      throw new Error('Path containment violation: "references" directory is a symbolic link.');
    }

    // Freeze snapshot so dynamic getter/proxy properties cannot mutate keys between validation and writing
    const rawEntries = Object.entries(spec.references);
    for (const [refKey, refVal] of rawEntries) {
      if (typeof refVal !== "string") {
        throw new TypeError(`Field 'references["${refKey}"]' must be a string.`);
      }
    }
    const entries = rawEntries.map(
      ([k, v]) => [String(k), v as string] as [string, string]
    );

    const seenRefKeys = new Set<string>();
    for (const [refName, refContent] of entries) {
      if (!REF_NAME_REGEX.test(refName)) {
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

      const targetPathUnresolved = join(refDir, `${refName}.md`);
      if (existsSync(targetPathUnresolved) && lstatSync(targetPathUnresolved).isSymbolicLink()) {
        throw new Error(
          `Path containment violation: Target reference "${refName}.md" is a symbolic link.`
        );
      }
    }

    validatedReferences = entries;
  }

  // Preflight validation for evals before creating any directories or writing files
  if (spec.evals !== undefined && spec.evals !== null) {
    if (!Array.isArray(spec.evals)) {
      throw new TypeError("Field 'evals' must be an array of evaluation items.");
    }

    for (let i = 0; i < spec.evals.length; i++) {
      const item = spec.evals[i];
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new TypeError(`Field 'evals[${i}]' must be an object.`);
      }

      if (typeof item.id !== "string" || item.id.trim().length === 0) {
        throw new (typeof item.id !== "string" ? TypeError : Error)(
          `Field 'evals[${i}].id' must be a non-empty string.`
        );
      }

      if (
        item.description !== undefined &&
        item.description !== null &&
        typeof item.description !== "string"
      ) {
        throw new TypeError(`Field 'evals[${i}].description' must be a string.`);
      }

      if (
        item.assertions === undefined ||
        item.assertions === null ||
        !Array.isArray(item.assertions) ||
        item.assertions.length === 0
      ) {
        throw new (Array.isArray(item.assertions) ? Error : TypeError)(
          `Field 'evals[${i}].assertions' must be a non-empty array of assertion objects.`
        );
      }

      for (let j = 0; j < item.assertions.length; j++) {
        const assertion = item.assertions[j];
        if (!assertion || typeof assertion !== "object" || Array.isArray(assertion)) {
          throw new TypeError(`Field 'evals[${i}].assertions[${j}]' must be an object.`);
        }

        if (typeof assertion.pattern !== "string" || assertion.pattern.trim().length === 0) {
          throw new (typeof assertion.pattern !== "string" ? TypeError : Error)(
            `Field 'evals[${i}].assertions[${j}].pattern' must be a non-empty string.`
          );
        }

        if (
          assertion.required !== undefined &&
          assertion.required !== null &&
          typeof assertion.required !== "boolean"
        ) {
          throw new TypeError(
            `Field 'evals[${i}].assertions[${j}].required' must be a boolean.`
          );
        }
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
    `- Target Hosts: ${(spec.target_hosts && spec.target_hosts.length > 0 ? spec.target_hosts : ["agent-skills", "chatgpt", "codex", "claude-code"]).join(", ")}`,
    `- Freedom Level: ${spec.freedom_level || "medium"}`,
    ""
  );

  writeFileSync(join(targetDir, "SKILL.md"), skillMdLines.join("\n"), "utf-8");

  if (validatedReferences.length > 0) {
    mkdirSync(refDir, { recursive: true });
    for (const [refName, refContent] of validatedReferences) {
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
