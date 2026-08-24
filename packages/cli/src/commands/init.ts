import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pc from "picocolors";

export function initSkillCommand(name: string, options: { description?: string }) {
  const kebabName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const targetDir = join(process.cwd(), kebabName);
  mkdirSync(targetDir, { recursive: true });
  mkdirSync(join(targetDir, "references"), { recursive: true });
  mkdirSync(join(targetDir, "scripts"), { recursive: true });
  mkdirSync(join(targetDir, "evals"), { recursive: true });

  const desc = options.description || `Autonomous skill for ${kebabName}. Use when the agent needs repeatable, deterministic actions.`;

  const skillContent = `---
name: ${kebabName}
description: >
  ${desc}
---

# ${kebabName.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}

> Autonomous execution engine for ${kebabName}.

## Invariant Guidelines

1. State evidence before asserting success or making mutations.
2. Follow deterministic decision gates.
3. Validate inputs against expected schemas.

## Capability Contract

- Supported Hosts: ChatGPT, Codex, Claude Code, Agent Skills, Antigravity
- Freedom Level: Medium
`;

  writeFileSync(join(targetDir, "SKILL.md"), skillContent, "utf-8");

  const sampleEval = {
    evals: [
      {
        id: "trigger-positive-1",
        prompt: `Run ${kebabName} for me`,
        assertions: [{ pattern: kebabName, required: true }]
      },
      {
        id: "negative-collision-1",
        prompt: "Tell me a generic joke",
        assertions: [{ pattern: kebabName, required: false }]
      }
    ]
  };

  writeFileSync(join(targetDir, "evals", "evals.json"), JSON.stringify(sampleEval, null, 2), "utf-8");

  console.log(pc.green(`✔ Created OmniSkill package at: `) + pc.bold(targetDir));
}
