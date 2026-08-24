# OmniSkill v5.0 Standard Specification

## 1. Abstract

OmniSkill defines a vendor-neutral, behavioral-first architecture for AI Agent Skills. It decouples the core behavioral contract (intent, preconditions, decision trees, evidence requirements, and binary assertions) from host-specific execution adapters (ChatGPT, Codex, Claude Code, Antigravity, OpenCode, Cursor).

## 2. The 10 Invariant Contracts

Every certified OmniSkill MUST satisfy ten invariant contracts:

1. **Identity**: Unique kebab-case name, single unambiguous job, declared user persona.
2. **Activation**: Multi-trigger coverage (direct positive, implicit natural language, close negatives, and collision boundary).
3. **Behavior**: Explicit preconditions, structured decision matrices, and measurable completion criteria.
4. **Knowledge Layering**: Separation of active runtime instructions (`SKILL.md`) from deep reference guides (`references/`).
5. **Freedom Level Calibration**:
   - *High Freedom*: Broad heuristic guidance for subjective/creative decisions.
   - *Medium Freedom*: Stepwise algorithms and decision trees.
   - *Low Freedom*: Deterministic code scripts (`scripts/`) and strict JSON schemas.
6. **Capability Transparency**: Declaration of required vs. optional host capabilities (read, search, patch, shell, python).
7. **Evidence Gate**: Strict prohibition of ungrounded success claims; required proof before state mutations.
8. **Evaluation Rigor**: BinEval binary scoring assertions with held-out test splits (70/30 train/eval ratio).
9. **Portability Matrix**: Verified compatibility targets (`agent-skills`, `chatgpt`, `codex`, `claude-code`, `antigravity`).
10. **Release Certification**: Multi-gate static analysis, secret scans, and zero-error packaging.

## 3. Directory Layout Standard

```
<skill-name>/
├── SKILL.md                 # Primary entrypoint (<500 lines) with YAML frontmatter
├── references/              # Deep domain guides, API docs, error catalogs
│   └── domain-guide.md
├── scripts/                 # Deterministic execution helpers (Python/Node/Bash)
│   └── helper.py
├── evals/                   # BinEval assertions, trigger banks, held-out suites
│   └── evals.json
└── assets/                  # Diagrams, visual artifacts, and schemas
```
