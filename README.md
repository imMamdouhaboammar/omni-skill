<p align="center">
  <img src="assets/mark.svg" alt="OmniSkill Mark" width="128" height="128">
</p>

<h1 align="center">OmniSkill</h1>

<p align="center">
  <strong>Universal Agent Skill Engineering System & Poteto Mode: Create once, engineer deeply, ship to every agent.</strong>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#poteto-mode">Poteto Mode (24 Principles)</a> •
  <a href="#all-agents-support">All Agents Support</a> •
  <a href="#dynamic-agentic-router">Agentic Router</a> •
  <a href="#skills-suite">Skills Suite</a> •
  <a href="#cli-usage">CLI Usage</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-6.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/homebrew-supported-gold.svg" alt="Homebrew">
  <img src="https://img.shields.io/badge/skills.sh-vercel%20registry-purple.svg" alt="Skills.sh">
  <img src="https://img.shields.io/badge/claude--code-marketplace-orange.svg" alt="Claude Code Plugin">
  <img src="https://img.shields.io/badge/engine-Bun%20%2B%20Python-black.svg" alt="Runtime">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
</p>

---

## Overview

**OmniSkill** is the industrial-grade, cross-host evolution of Anthropic's official [`skill-creator`](https://github.com/anthropics/skills/tree/main/skills/skill-creator).

While baseline `skill-creator` provides basic prompt scaffolding for Claude alone, **OmniSkill** elevates skill creation into an autonomous, multi-agent engineering discipline powered by **Poteto Mode** (24 battle-tested engineering principles) and **AgentSkills.io v1 Tripartite Architecture**:

$$\text{Intent (Any Lang)} \longrightarrow \text{Dynamic DAG} \longrightarrow \text{Poteto Gates} \longrightarrow \text{BinEval Harness} \longrightarrow \text{Cross-Host Release}$$

---

## ⚡ Why OmniSkill vs Official `/skill-creator`?

| Capability | Anthropic Official [`skill-creator`](https://github.com/anthropics/skills/tree/main/skills/skill-creator) | ⚡ **OmniSkill 6.0 Engine** |
|---|:---:|:---:|
| **Target AI Hosts** | Claude Code only (Vendor Lock-in) | **Every AI Agent** (Claude Code, ChatGPT, Codex, Cursor, Windsurf, Cline, Antigravity) |
| **Workflow & Routing** | Static single prompt | **Dynamic Agentic Router** (Intelligent DAG generation & intent classifier) |
| **Engineering Discipline** | None | **Poteto Mode** (24 codified principles: boundary discipline, laziness, subtract first) |
| **Empirical Gates** | Guesswork | **`measure-dont-guess`** (Hypothesis-first benchmarking & bounds analysis) |
| **Behavioral Testing** | Manual inspection | **BinEval Assertion Harness** (70/30 train/held-out evals & pressure gates) |
| **Validation Gate** | Basic checks | **7-Pass Static Analysis Gate** (Links, schema, line budget, anti-slop, secrets) |
| **Cross-Host Compilation** | None (manual conversion) | **Automated Portability Compiler** (`.cursorrules`, `.claude-plugin`, `.codex-plugin`) |
| **Universal Distribution** | Manual file copying | **Dual Marketplace** (Claude Code Plugin Marketplace + Vercel Skills CLI) |

---

## Installation

### 1. Claude Code Native Marketplace
Inside Claude Code:
```bash
/plugin marketplace add imMamdouhaboammar/omni-skill
/plugin install omni-skill@imMamdouhaboammar
```
Or from your shell:
```bash
claude plugin marketplace add imMamdouhaboammar/omni-skill
claude plugin install omni-skill@imMamdouhaboammar
```

### 2. Vercel Skills CLI
```bash
npx skills add imMamdouhaboammar/omni-skill
```

### 3. Homebrew (macOS & Linux)
```bash
brew tap imMamdouhaboammar/omni-skill https://github.com/imMamdouhaboammar/omni-skill
brew install omni-skill
```

### 4. Global Bun / npm CLI
```bash
bun add -g @mamdouh-aboammar/omni-skill
# Or run ad-hoc
bunx @mamdouh-aboammar/omni-skill --help
```

---

## Poteto Mode: The 24 Engineering Principles

OmniSkill embeds Cursor's and masseater's battle-tested 24 engineering principles directly into its core engine and skill library:

- **[`attack-the-premise`](skills/poteto-principles/references/attack-the-premise.md)**: Suspect the shared premise when multiple fixes fail.
- **[`boundary-discipline`](skills/poteto-principles/references/boundary-discipline.md)**: Consolidate validation at the perimeter; trust internal types unconditionally.
- **[`build-the-lever`](skills/poteto-principles/references/build-the-lever.md)**: Replace manual repetition with rerunnable scripts and codemods.
- **[`encode-lessons-in-structure`](skills/poteto-principles/references/encode-lessons-in-structure.md)**: Turn recurring rules into linters, schemas, and validators.
- **[`explain-the-number`](skills/poteto-principles/references/explain-the-number.md)**: Name the resource bounding every measured number ("why not double?").
- **[`fix-root-causes`](skills/poteto-principles/references/fix-root-causes.md)**: Trace defects to underlying mechanisms; never patch symptoms.
- **[`make-operations-idempotent`](skills/poteto-principles/references/make-operations-idempotent.md)**: Ensure commands converge correctly regardless of retries.
- **[`migrate-callers-then-delete-legacy-apis`](skills/poteto-principles/references/migrate-callers-then-delete-legacy-apis.md)**: Eliminate old APIs in the same wave as new ones.
- **[`model-the-domain`](skills/poteto-principles/references/model-the-domain.md)**: Make invalid states unrepresentable in domain data structures.
- **[`prove-it-works`](skills/poteto-principles/references/prove-it-works.md)**: Check the real runtime directly; never rely on proxies or self-reports.
- **[`subtract-before-you-add`](skills/poteto-principles/references/subtract-before-you-add.md)**: Excise dead code, unused shims, and speculative scaffolding first.
- **[`type-system-discipline`](skills/poteto-principles/references/type-system-discipline.md)**: Model variants with discriminated unions; parse at boundaries.

*See [`skills/poteto-principles`](skills/poteto-principles) for all 24 principles.*

---

## Skills Suite

OmniSkill includes fifteen modular, certified sub-skills:

### 1. Engineering Discipline Suite
| Skill | Directory | Job |
|---|---|---|
| **`poteto-principles`** | [`skills/poteto-principles`](skills/poteto-principles) | 24 battle-tested engineering principles for architecture, refactoring, and code review. |
| **`measure-dont-guess`** | [`skills/measure-dont-guess`](skills/measure-dont-guess) | Empirical measurement, hypothesis formulating, and bounds analysis before implementation. |
| **`dont-it-yourself`** | [`skills/dont-it-yourself`](skills/dont-it-yourself) | Standard library and ecosystem package reuse; bans duplicate wrappers and helpers. |
| **`integrate`** | [`skills/integrate`](skills/integrate) | Adopting new tools, migrating all call sites, and mechanically enforcing legacy lockout. |
| **`humanity-and-humanness`** | [`skills/humanity-and-humanness`](skills/humanity-and-humanness) | Human cognitive grounding: inferential reading, strawman drafts, and intent alignment. |
| **`writing`** | [`skills/writing`](skills/writing) | High-density technical writing: direct payload invariant and zero narrative filler. |
| **`skill-authoring`** | [`skills/skill-authoring`](skills/skill-authoring) | Canonical AgentSkills.io v1 authoring standard with mandatory rationale and tripartite layout. |

### 2. Autonomous Toolchain & Lifecycle Suite
| Skill | Directory | Job |
|---|---|---|
| **`omni-skill`** | [`skills/omni-skill`](skills/omni-skill) | Master orchestrator and dynamic router across all agent hosts. |
| **`skill-conductor`** | [`skills/skill-conductor`](skills/skill-conductor) | Full lifecycle conductor: BinEval scoring, trigger optimization loops, and automated packaging. |
| **`repo-craft-and-distribute`** | [`skills/repo-craft-and-distribute`](skills/repo-craft-and-distribute) | Universal multi-agent manifest distributor and GitHub repository crafter. |
| **`skill-architect`** | [`skills/skill-architect`](skills/skill-architect) | Architecture-first design, workflow/SOP compilation, and freedom calibration. |
| **`skill-evaluator`** | [`skills/skill-evaluator`](skills/skill-evaluator) | Activation trigger banks, BinEval assertions, held-out splits (70/30), and pressure testing. |
| **`skill-portability-compiler`** | [`skills/skill-portability-compiler`](skills/skill-portability-compiler) | Cross-host adapter compiler generating target manifests and capability gap reports. |
| **`host-workspace-operator`** | [`skills/host-workspace-operator`](skills/host-workspace-operator) | Safe, read-first workspace operations mapped to host-native capabilities. |
| **`sandbox-python-executor`** | [`skills/sandbox-python-executor`](skills/sandbox-python-executor) | Deterministic Python helper for parsing, hash verification, and archive inspection. |

---

## ⚡ Dynamic Agentic Router

```mermaid
flowchart TD
    A["User Prompt (Any Language)"] --> B["OmniSkill Agentic Router"]
    B --> C["Host Capability Negotiation"]
    B --> D["Intent Classifier (12 Modes)"]
    C --> E["Dynamic Execution DAG"]
    D --> E
    
    subgraph ExecutionPipeline ["Autonomous Skill Pipeline"]
        F["1. Authoring Standard (skill-authoring)"]
        G["2. Poteto Discipline (poteto-principles)"]
        H["3. Empirical Benchmark (measure-dont-guess)"]
        I["4. Integration Migration (integrate)"]
        J["5. Behavioral Evals (skill-evaluator)"]
        K["6. 7-Pass Validation (omni-skill validate)"]
        L["7. Multi-Host Ports (skill-portability-compiler)"]
    end
    
    E --> ExecutionPipeline
    ExecutionPipeline --> M["Release-Ready Skill Artifact"]
```

---

## CLI Usage

```bash
# 1. Dynamic Agentic Router
omni-skill route "integrate drizzle orm and migrate prisma" --explain
omni-skill route "benchmark latency before optimizing" --explain
omni-skill route "قيس السرعة قبل التعديل" --explain

# 2. Initialize a new tripartite skill package
omni-skill init my-skill -d "High performance query optimizer"

# 3. Run the 7-pass static validator
omni-skill validate skills/omni-skill
omni-skill validate skills/poteto-principles

# 4. Port a skill to any AI agent (Claude, Cursor, Codex, Windsurf, Antigravity)
omni-skill port examples/sql-optimizer --target cursor
omni-skill port examples/sql-optimizer --target claude
omni-skill port examples/sql-optimizer --target codex

# 5. Run BinEval test harness
omni-skill eval skills/omni-skill
```

---

## Testing & Quality Assurance

```bash
# Run Bun unit test suite
bun test

# Run Python core engine tests
python3 packages/core/test_engine.py

# Run 7-pass validation across all skills
for s in skills/*; do bun run packages/cli/src/index.ts validate "$s"; done
```

---

## License

Distributed under the [MIT License](LICENSE). See [PRIVACY.md](PRIVACY.md), [TERMS.md](TERMS.md), and [SUPPORT.md](SUPPORT.md).
