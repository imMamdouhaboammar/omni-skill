---
name: writing
description: Standards and guidelines for drafting high-density, anti-slop technical documentation, PR summaries, commit messages, architectural records, and agent instructions. Use when writing, editing, or polishing documentation and instructions, or to remove AI writing tropes, unnecessary conversational preambles, and low-density filler.
metadata:
  derived-from: https://github.com/masseater/skills/tree/main/skills/writing
---

# writing

A technical writing discipline for clear, high-density, anti-slop prose.

## Why This Skill Is Needed & Target State

**Why this skill is needed:** AI agents construct prose by unreflective pattern matching from typical training corpora: inserting defensive preambles ("The following table outlines..."), duplicating perishable constants that can be derived directly from source code, narrating obvious syntax ("// increment i"), and speaking in a monotone, patronizing voice. This dilutes technical substance, tires human readers, and buries essential invariants under ceremonial text.

**Target state:** Every document conveys the author's exact decisions and technical reasoning on a single pass, transitions immediately from headers into direct payloads, and contains zero perishable or decorative fluff.

## Invariant Guidelines

1. **Direct Payload Invariant**: Transition directly from domain headers to technical payloads (tables, code blocks, lists, schemas) with zero transitional preambles or affordance narration.
2. **Purpose Before Means**: State the objective or problem being solved before prescribing the procedure or mechanism per `purpose-before-means`.
3. **No Perishable Information**: Never duplicate information in markdown that can be derived from code, lockfiles, or type signatures per `no-perishable-information`.
4. **Single Topic per Document**: Separate reference facts (`references/`), procedural playbooks (`usecases/`), and conceptual explanations.
5. **One Actionable Decision per Sentence**: Pack only one load-bearing directive per sentence so humans and agents do not skim past secondary requirements.

## Execution Workflows

- [`ai-context`](usecases/ai-context.md): Drafting high-signal context documents for AI agents (`SKILL.md`, `AGENTS.md`, `CLAUDE.md`).
- [`readme-md`](usecases/readme-md.md): Writing lean, high-conversion project `README.md` files that respect reader time.

## Domain References

- [`purpose-before-means`](references/purpose-before-means.md): Ordering rules so readers understand the goal before the implementation.
- [`no-perishable-information`](references/no-perishable-information.md): Eliminating drift-prone duplicating of code data.
- [`purpose-and-reason`](references/purpose-and-reason.md): Pairing every rule with its underlying mechanical rationale.
- [`rhythm`](references/rhythm.md): Designing scannable text rhythm and scannability.

## Delegated Skills

- `humanity-and-humanness`: Respect human cognitive processing and inferential reading.
- `poteto-principles`: Follow `minimize-reader-load` and `subtract-before-you-add`.
- `anti-slop-engineering`: Follow Gate 3 (Taste, Visual Restraint & Clean UI Microcopy) and Gate 0 (Zero Speculative Docs).
