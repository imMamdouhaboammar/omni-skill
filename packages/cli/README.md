# @mamdouh-aboammar/omni-skill

> Universal Cross-Host Agent Skill Engine & Compiler. Build deeply engineered skills once, validate across 7 strict static gates, and distribute seamlessly across Claude Code, Cursor, Codex, ChatGPT, and Antigravity.

[![npm version](https://img.shields.io/npm/v/@mamdouh-aboammar/omni-skill.svg?style=flat-square)](https://www.npmjs.com/package/@mamdouh-aboammar/omni-skill)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Runtime: Bun & Node](https://img.shields.io/badge/Runtime-Bun%20%7C%20Node.js-black?style=flat-square)](https://bun.sh)

---

## Installation

### Run Ad-hoc (No Installation Required)

```bash
# Using Bun (Recommended)
bunx @mamdouh-aboammar/omni-skill route "profile latency with py-spy before optimizing"

# Using Node.js (npx)
npx @mamdouh-aboammar/omni-skill route "profile latency with py-spy before optimizing"
```

### Global Installation

```bash
# Using Bun
bun add -g @mamdouh-aboammar/omni-skill

# Using npm
npm install -g @mamdouh-aboammar/omni-skill
```

---

## Features

- **Dynamic Agentic Router**: Classifies prompts into 13 high-discipline modes (`MEASURE`, `INTEGRATE`, `PRINCIPLES`, `AUTHOR`, `VALIDATE`, `EVAL`, `CREATE`, etc.) with bilingual (English & Arabic) NLP intent detection.
- **Progressive Context Budgeting**: Builds execution DAGs that load only the exact references needed, capping initial token overhead at <2,500 tokens.
- **7-Pass Static Analysis Engine**: Audits frontmatter schemas, rationale headers, link integrity, line budgets (<500 lines), anti-slop rules, recursive secret detection, and cross-platform personal paths.
- **Multi-Host Adapters**: Compiles universal skills to native host artifacts for Claude Code (`SKILL.md`), ChatGPT / Codex (`plugin.json`), Cursor (`.cursorrules`), Windsurf, Cline, and Antigravity.

---

## CLI Reference

### `omni-skill route <prompt>`
Analyzes natural language requests and generates optimal multi-step execution DAGs with progressive reference loading.

```bash
omni-skill route "Measure database connection pool latency" -e
```

### `omni-skill validate [paths...]`
Runs the 7-pass static analysis engine over one or multiple skill packages.

```bash
omni-skill validate skills/*
```

### `omni-skill init <name>`
Scaffolds a production-grade AgentSkills.io tripartite skill structure (`SKILL.md`, `references/`, `usecases/`, `evals/`).

```bash
omni-skill init my-awesome-skill -d "Automated schema migration and validation"
```

### `omni-skill compile <spec.json>`
Compiles an OmniSkill JSON specification into a validated, multi-host skill package.

```bash
omni-skill compile ./spec.json -o ./dist/skills
```

---

## Programmatic Usage

```typescript
import { routeSkillRequest, validateSkillDirectory, classifyIntent } from "@mamdouh-aboammar/omni-skill";

// 1. Classify intent and build DAG
const plan = routeSkillRequest("Audit memory leaks before deploy", {
  currentHost: "universal",
  explain: true,
});
console.log(plan.executionGraph);

// 2. Validate skill package
const report = validateSkillDirectory("./skills/my-skill");
if (!report.pass) {
  console.error("Validation failed:", report.findings);
}
```

---

## License

MIT © Mamdouh Aboammar
