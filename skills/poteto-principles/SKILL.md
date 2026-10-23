---
name: poteto-principles
description: Apply the 24 battle-tested engineering principles for architecture design, refactoring, implementation, bug diagnosis, migration, and verification. Use when deciding technical tradeoffs, structuring systems, writing tests, or reviewing code changes.
metadata:
  derived-from: https://github.com/cursor/plugins/tree/c86f349b102feb91f1966f8a6a60882a4e601b50/pstack/skills
---

# poteto-principles

A battle-tested catalog of 24 foundational engineering principles for autonomous agents and engineers.

## Why This Skill Is Needed & Target State

**Why this skill is needed:** Engineers and AI agents only question decisions using perspectives active in their immediate attention. Unconsidered failure modes never surface as questions, leading to silent repetitions of known mistakes: scattered validation, symptom patching, loose test assertions, premature frameworks, and leaky abstractions.

**Target state:** Every architectural decision, refactoring step, implementation slice, and code review is systematically evaluated through these proven principles, producing robust, minimal, type-safe, and self-verifying systems.

## The 24 Principles

Read all linked references in [`references/`](references/) relevant to your active task:

- [`attack-the-premise`](references/attack-the-premise.md): When two or more fixes sharing one premise fail the same gate, suspect the premise rather than the fixes.
- [`boundary-discipline`](references/boundary-discipline.md): Consolidate validation, type narrowing, and error handling at system boundaries; trust internal types unconditionally; keep business logic in pure functions.
- [`build-the-lever`](references/build-the-lever.md): Avoid tedious repetitive manual edits; build the deterministic script, generator, or codemod that does the job rerunnably.
- [`encode-lessons-in-structure`](references/encode-lessons-in-structure.md): When an instruction is repeated twice, convert it from natural language into a linter, schema, metadata, or verification check.
- [`exhaust-the-design-space`](references/exhaust-the-design-space.md): For unprecedented or critical designs, construct 2-3 competing prototypes to contrast tradeoffs before deciding.
- [`experience-first`](references/experience-first.md): When implementation convenience conflicts with user delight, choose user delight; polish fewer features to perfection.
- [`explain-the-number`](references/explain-the-number.md): Before trusting a benchmark or metric, name what physical resource or code path bounds it ("why not double?").
- [`fix-root-causes`](references/fix-root-causes.md): Never patch symptoms. Reproduce first, ask "why" recursively, and eliminate the underlying mechanism.
- [`foundational-thinking`](references/foundational-thinking.md): Settle data structures and core domain types before writing algorithmic logic.
- [`guard-the-context-window`](references/guard-the-context-window.md): Delegate verbose token dumps and research to subagents; retain only concise summaries in the primary context thread.
- [`laziness-protocol`](references/laziness-protocol.md): Default to subtraction; make the smallest coherent change that solves the problem.
- [`make-operations-idempotent`](references/make-operations-idempotent.md): Design commands and mutators so that repeated execution or mid-flight crash recovery converges to the same target state.
- [`migrate-callers-then-delete-legacy-apis`](references/migrate-callers-then-delete-legacy-apis.md): When introducing a replacement API, migrate all call sites and eliminate the legacy interface in the same release wave.
- [`minimize-reader-load`](references/minimize-reader-load.md): Reduce both the number of layers a reader must traverse and the working state they must hold in mind.
- [`model-the-domain`](references/model-the-domain.md): Make invalid states unrepresentable in the data structure instead of scattering defensive branch checks.
- [`never-block-on-the-human`](references/never-block-on-the-human.md): For reversible and reviewable actions, proceed with reasonable decisions and present verifiable results rather than stalling.
- [`outcome-oriented-execution`](references/outcome-oriented-execution.md): In planned refactors and migrations, prioritize convergence on the verified final state over preserving fragile intermediate states.
- [`prove-it-works`](references/prove-it-works.md): Verify work against the real runtime environment or live binary, never via self-reports, mocks, or passive assumptions.
- [`redesign-from-first-principles`](references/redesign-from-first-principles.md): When integrating new requirements, design as if the requirement was present from the beginning rather than bolting on shims.
- [`separate-before-serializing-shared-state`](references/separate-before-serializing-shared-state.md): Eliminate mutable shared state where possible; where unavoidable, enforce structural serialization via lockfiles or explicit phases.
- [`sequence-verifiable-units`](references/sequence-verifiable-units.md): Break work into small, verifiable slices where each slice transitions from red to green before proceeding.
- [`subtract-before-you-add`](references/subtract-before-you-add.md): Remove obsolete code, unused parameters, dead branches, and speculative scaffolding before introducing additions.
- [`test-behavior-not-implementation`](references/test-behavior-not-implementation.md): Invoke the code as callers do and assert literal outcomes; delete tests that pass if the subject returns dummy stubs.
- [`type-system-discipline`](references/type-system-discipline.md): Model variants as tagged unions; brand semantic primitives; validate external payloads at boundaries; never lie to the compiler with casts.

## Invariant Rules

1. **Cite the Principle with Evidence**: When applying a principle, cite its file name and state the concrete before/after change.
2. **Structural Levers Over Narrative Rules**: Convert repeated warnings into mechanical linters or schema validations per `encode-lessons-in-structure`.
3. **Subtract First**: Delete dead code, unused flags, and abandoned abstractions before adding new features per `subtract-before-you-add`.
