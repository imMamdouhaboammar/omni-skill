import { OmniSkillSpec } from "./types";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function compileOmniSkillSpec(spec: OmniSkillSpec, outputDir: string): string {
  const targetDir = join(outputDir, spec.name);
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
