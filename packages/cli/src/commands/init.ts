import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pc from "picocolors";

export function initSkillCommand(name: string, options: { description?: string }) {
  const kebabName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const targetDir = join(process.cwd(), kebabName);
  mkdirSync(targetDir, { recursive: true });
  mkdirSync(join(targetDir, "usecases"), { recursive: true });
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

## Why This Skill Is Needed & Target State

**Why this skill is needed:** Without this skill, agents perform ${kebabName} using ad-hoc statistical guesses, skipping invariant checks and producing unverified outputs.

**Target state:** Every ${kebabName} task executes through verified deterministic procedures with falsifiable evidence and zero hallucinations.

## Invariant Rules

1. **Evidence First**: State verified evidence before asserting task completion per \`prove-it-works\`.
2. **Boundary Discipline**: Validate inputs and handle errors at the perimeter per \`boundary-discipline\`.
3. **Subtract Complexity**: Make the minimal coherent change that solves the problem per \`subtract-before-you-add\`.

## Execution Workflows

- [\`run\`](usecases/run.md): Operational procedure for executing ${kebabName}.

## Domain References

- [\`spec\`](references/spec.md): Technical specification, schemas, and error boundaries.

## Delegated Skills

- \`poteto-principles\`: Adhere to the 24 battle-tested engineering principles.
`;

  writeFileSync(join(targetDir, "SKILL.md"), skillContent, "utf-8");

  const runUsecase = `# Run ${kebabName}

Operational procedure for executing ${kebabName}.

1. **Verify Preconditions**: Confirm required inputs, tools, and permissions exist.
2. **Execute Core Operation**: Perform the bounded task following the invariant rules.
3. **Validate Outcome**: Prove the result satisfies the completion criteria with independent evidence.
`;
  writeFileSync(join(targetDir, "usecases", "run.md"), runUsecase, "utf-8");

  const specRef = `# ${kebabName} Specification

Technical schemas, invariants, and domain error definitions for ${kebabName}.
`;
  writeFileSync(join(targetDir, "references", "spec.md"), specRef, "utf-8");

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
