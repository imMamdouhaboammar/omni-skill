# OmniSkill v6.0 Standard Specification

## 1. Abstract

OmniSkill defines an industrial-grade, vendor-neutral, behavioral-first architecture for AI Agent Skills. It decouples core behavioral contracts (intent, preconditions, decision trees, evidence requirements, and binary assertions) from host-specific execution adapters (ChatGPT, Codex, Claude Code, Antigravity, OpenCode, Cursor, Windsurf, Cline).

OmniSkill 6.0 integrates the **Poteto Mode 24 Engineering Principles** and the **AgentSkills.io v1 Tripartite Specification**.

## 2. The 10 Invariant Contracts

Every certified OmniSkill MUST satisfy ten invariant contracts:

1. **Identity**: Unique lowercase kebab-case name matching its directory, single unambiguous job, declared user persona.
2. **Activation**: Multi-trigger coverage (direct positive, implicit natural language, close negatives, and collision boundary).
3. **Behavioral Grounding**: Explicit preconditions, structured decision matrices, and measurable completion criteria.
4. **Tripartite Knowledge Layering**:
   - `SKILL.md`: Runtime instructions (<500 lines) containing mandatory *Why This Skill Is Needed & Target State* and invariant rules.
   - `usecases/`: Action-oriented procedural playbooks named with imperative verbs (`create.md`, `measure.md`, `integrate.md`).
   - `references/`: Context-isolated domain specifications, schemas, and error catalogs.
5. **Freedom Level Calibration**:
   - *High Freedom*: Broad heuristic guidance for subjective/creative decisions.
   - *Medium Freedom*: Stepwise algorithms and decision trees.
   - *Low Freedom*: Deterministic code scripts (`scripts/`) and strict JSON schemas.
6. **Capability Transparency**: Declaration of required vs. optional host capabilities (read, search, patch, shell, python).
7. **Evidence Gate**: Strict prohibition of ungrounded success claims; required proof before state mutations per `prove-it-works`.
8. **Evaluation Rigor**: BinEval binary scoring assertions with held-out test splits (70/30 train/eval ratio).
9. **Portability Matrix**: Verified compatibility targets (`agent-skills`, `chatgpt`, `codex`, `claude-code`, `antigravity`, `cursor`, `windsurf`, `cline`).
10. **7-Pass Release Certification**: Frontmatter schema, rationale/target state check, markdown link resolution, delegation integrity, line budget, secret leak detection, and anti-slop AST inspection.

## 3. Directory Layout Standard

```
<skill-name>/
├── SKILL.md                 # Primary entrypoint (<500 lines) with YAML frontmatter
├── usecases/                # Procedural playbooks (e.g. create.md, run.md, audit.md)
├── references/              # Deep domain guides, API docs, error catalogs
├── scripts/                 # Deterministic execution levers (Python/Node/Bash)
├── evals/                   # BinEval assertions, trigger banks, held-out suites
└── assets/                  # Diagrams, visual artifacts, and schemas
```

## 4. Poteto Principles Integration

Certified skills must adhere to the 24 foundational engineering principles:
- `attack-the-premise`
- `boundary-discipline`
- `build-the-lever`
- `encode-lessons-in-structure`
- `exhaust-the-design-space`
- `experience-first`
- `explain-the-number`
- `fix-root-causes`
- `foundational-thinking`
- `guard-the-context-window`
- `laziness-protocol`
- `make-operations-idempotent`
- `migrate-callers-then-delete-legacy-apis`
- `minimize-reader-load`
- `model-the-domain`
- `never-block-on-the-human`
- `outcome-oriented-execution`
- `prove-it-works`
- `redesign-from-first-principles`
- `separate-before-serializing-shared-state`
- `sequence-verifiable-units`
- `subtract-before-you-add`
- `test-behavior-not-implementation`
- `type-system-discipline`
