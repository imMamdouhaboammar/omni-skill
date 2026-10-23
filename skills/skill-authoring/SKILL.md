---
name: skill-authoring
description: Create, refine, audit, and evaluate Agent Skills according to the AgentSkills.io v1 specification and Poteto principles. Use when building a new skill, rewriting an existing skill, structuring SKILL.md, or enforcing quality gates on skill directories.
metadata:
  derived-from: https://github.com/cursor/plugins/blob/bebaffe14f8f442b98e9c409e960aedad59b5fc8/pstack/skills/poteto-mode/playbooks/authoring-a-skill.md
---

# skill-authoring

The definitive standard for authoring, structuring, and maintaining autonomous agent skills.

## Why This Skill Is Needed & Target State

**Why this skill is needed:** When an AI agent authors a skill without strict structural standards, it lacks the human author's tacit judgment. The agent fills unspecified areas with speculative disclaimers, generic templates, and arbitrary directory structures. These hallucinated artifacts remain in the skill and are subsequently executed by other agents as authoritative rules. To prevent this, skill creation must be constrained by strict structural separation, minimal diff discipline, and mechanical validation.

**Target state:** Every authored skill is lean, deterministic, conforms 100% to the AgentSkills.io v1 specification, separates invariants from procedural steps, and passes automated static analysis with zero errors.

## The Tripartite Layout Standard

Every certified skill directory MUST follow the tripartite structure:

```
<skill-name>/
├── SKILL.md                 # Entrypoint: Frontmatter, Rationale, Invariants (<500 lines)
├── usecases/                # Procedural playbooks (verb-phrased: create.md, revise.md)
├── references/              # Domain schemas, error catalogs, specification references
├── scripts/                 # Optional deterministic levers and test scripts
└── evals/                   # Optional BinEval test suites and assertion banks
```

## Mandatory Sections in SKILL.md

1. **Frontmatter**:
   - `name`: Must match the directory name exactly in lowercase kebab-case.
   - `description`: State what the skill does AND when to use it (including natural language triggers).
   - `metadata.derived-from`: Permalink to canonical origin if derived.
2. **Title & Single-Line Job**: `# <skill-name>` followed by a concise blockquote.
3. **`## Why This Skill Is Needed & Target State`**:
   - Explicit paragraph explaining the mechanical failure mode without the skill.
   - Explicit paragraph defining the target state achieved by following the skill.
4. **`## Invariant Rules`**: Numbered, non-negotiable architectural constraints with single-line reasons.
5. **`## Execution Workflows`**: Bulleted list linking to `usecases/<verb>.md`.
6. **`## Domain References`**: Bulleted list linking to `references/<name>.md`.
7. **`## Delegated Skills`**: Clear delegation by skill name without duplicating peer prose.

## Authoring Invariants

1. **Do Not Fill with Fluff (`埋めない`)**: Never generate unrequested notes, hypothetical warnings, or speculative disclaimers. If a detail is unstated, provide a strawman recommendation and verify.
2. **Delegate, Do Not Re-explain (`委ねる`)**: When relying on another skill, name it directly. Never re-summarize its instructions.
3. **Keep Under Line Budget**: `SKILL.md` MUST remain under 500 lines. Move deep domain guides into `references/` and step-by-step procedures into `usecases/`.
4. **Verb-Named Workflows**: Name files in `usecases/` with active verbs (`create.md`, `measure.md`, `integrate.md`), not topics.

## Execution Workflows

- [`create`](usecases/create.md): Scaffolding and authoring a new skill from scratch.
- [`revise`](usecases/revise.md): Updating an existing skill based on feedback without architectural drift.
- [`audit`](usecases/audit.md): Running static verification and quality checks on a skill package.

## Domain References

- [`agentskills-spec`](references/agentskills-spec.md): Complete AgentSkills.io v1 schema and validation rules.

## Delegated Skills

- `poteto-principles`: Apply `redesign-from-first-principles`, `subtract-before-you-add`, and `boundary-discipline`.
- `writing`: Follow the direct payload invariant and rhythmic clarity.
- `humanity-and-humanness`: Structure drafts for intuitive human feedback.
