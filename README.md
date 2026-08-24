<p align="center">
  <img src="assets/mark.svg" alt="OmniSkill Mark" width="128" height="128">
</p>

<h1 align="center">OmniSkill</h1>

<p align="center">
  <strong>Universal Cross-Host Agent Skill Engineering Engine & Compiler</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#quickstart">Quickstart</a> •
  <a href="#cli-usage">CLI Usage</a> •
  <a href="#skills-suite">Skills Suite</a> •
  <a href="#specification">Specification</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-5.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/engine-Bun%20%2B%20Python-black.svg" alt="Runtime">
  <img src="https://img.shields.io/badge/platforms-ChatGPT%20|%20Codex%20|%20Claude%20|%20Antigravity-orange.svg" alt="Platforms">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
</p>

---

## Overview

**OmniSkill** is the universal standard and engineering toolkit for designing, testing, compiling, and packaging high-reliability AI Agent Skills across any runtime or IDE.

Whether you are targeting **OpenAI ChatGPT & Codex Plugins**, **Claude Code Skills**, **Google Antigravity & Gemini CLI**, or **standard Agent Skills**, OmniSkill decouples your core behavioral contract from vendor-specific syntax and provides verifiable execution gates before release.

$$\text{Intent} \longrightarrow \text{OmniSkillSpec} \longrightarrow \text{Architecture} \longrightarrow \text{BinEval Harness} \longrightarrow \text{Host Compiler} \longrightarrow \text{Certified Release}$$

---

## Key Features

- **Multi-Host Compatibility**: Generate certified adapters for ChatGPT (`.codex-plugin`), Codex, Claude Code (`.claude-plugin`), Antigravity, OpenCode, and Cursor.
- **Dual-Engine Architecture**:
  - **Ultra-Fast Bun TypeScript CLI**: Scaffold, validate, compile, and package skills in milliseconds.
  - **Deterministic Python Core**: Zero-dependency AST validator, BinEval scoring engine, and security scanner.
- **Universal 10 Invariant Contracts**: Guarantees unambiguous identity, activation coverage, layered knowledge, freedom calibration, and strict evidence requirements.
- **BinEval & Pressure Testing**: Binary behavioral assertions with 70/30 held-out regression splits and secret leak detection.
- **Zero-Guessing Evidence Rule**: Never claims unexecuted tests passed; distinguishes structural validity from runtime proof.

---

## Skills Suite

OmniSkill ships with six focused, specialized sub-skills:

| Skill | Path | Primary Role |
|---|---|---|
| **`omni-skill`** | [`skills/omni-skill`](skills/omni-skill) | Master lifecycle orchestrator and mode router (`CREATE`, `IMPROVE`, `VALIDATE`, `REVIEW`, `OPTIMIZE`, `PORT`, `PACKAGE`). |
| **`skill-architect`** | [`skills/skill-architect`](skills/skill-architect) | Architecture-first design, workflow/SOP compilation, and freedom calibration. |
| **`skill-evaluator`** | [`skills/skill-evaluator`](skills/skill-evaluator) | Activation trigger banks, BinEval assertions, held-out splits, and pressure testing. |
| **`skill-portability-compiler`** | [`skills/skill-portability-compiler`](skills/skill-portability-compiler) | Host-neutral adapter compiler with automated capability gap reporting. |
| **`host-workspace-operator`** | [`skills/host-workspace-operator`](skills/host-workspace-operator) | Safe, read-first workspace operations mapped to host-native capabilities. |
| **`sandbox-python-executor`** | [`skills/sandbox-python-executor`](skills/sandbox-python-executor) | Deterministic Python helper for parsing, hash checks, archive inspection, and verification. |

---

## CLI Usage

Install dependencies and run commands using **Bun**:

```bash
# Initialize a new production-ready skill
bun run cli init my-awesome-skill -d "High-performance data analyst skill"

# Validate skill structure, frontmatter, security, and portability
bun run cli validate skills/omni-skill

# Run BinEval test harness
bun run cli eval skills/omni-skill

# Compile an OmniSkillSpec into target host packages
bun run cli compile spec.json --out ./dist

# Port a skill to ChatGPT, Codex, or Claude
bun run cli port skills/omni-skill --target chatgpt

# Package a release-ready artifact
bun run cli package skills/omni-skill
```

---

## Architecture Diagram

```
+-----------------------------------------------------------------------+
|                              OmniSkill v5                             |
+-----------------------------------------------------------------------+
                                   |
         +-------------------------+-------------------------+
         |                                                   |
         v                                                   v
+------------------+                               +--------------------+
|  TypeScript CLI  |                               | Python Core Engine |
|  (@omni-skill)   |                               |  (AST & BinEval)   |
+------------------+                               +--------------------+
         |                                                   |
         +-------------------------+-------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                           Host Adapters                               |
|   +-------------------+  +-------------------+  +-----------------+   |
|   |  ChatGPT / Codex  |  |    Claude Code    |  |   Antigravity   |   |
|   |  (.codex-plugin)  |  |  (.claude-plugin) |  |   & Gemini CLI  |   |
|   +-------------------+  +-------------------+  +-----------------+   |
+-----------------------------------------------------------------------+
```

---

## Testing & Quality Assurance

Run the comprehensive test suite across all engines:

```bash
# Run Bun unit tests
bun test

# Run Python engine tests
python3 packages/core/test_engine.py

# Validate all skills against multi-host profiles
bun run validate:all
```

---

## Specification

Read the formal [SPECIFICATION.md](SPECIFICATION.md) for details on the 10 Invariant Contracts, directory conventions, and evaluation standards.

---

## License

Distributed under the [MIT License](LICENSE). See [PRIVACY.md](PRIVACY.md), [TERMS.md](TERMS.md), and [SUPPORT.md](SUPPORT.md).
