---
name: dont-it-yourself
description: Search for and leverage existing runtime primitives, standard libraries, repository utilities, and battle-tested ecosystem packages rather than building custom implementations. Use before authoring new helpers, utility functions, wrapper shims, or external client libraries.
metadata:
  derived-from: https://github.com/masseater/skills/tree/main/skills/dont-it-yourself
---

# dont-it-yourself

A strict discipline to reuse proven ecosystem solutions and stop reinventing wheels.

## Why This Skill Is Needed & Target State

**Why this skill is needed:** For an AI agent, writing custom code is faster and easier than searching for existing packages. The agent hallucinates solutions from memory rather than checking what already exists in the runtime, repository, or package registry. Consequently, the project becomes burdened with unvetted, fragile home-rolled helpers that miss edge cases, lack performance optimizations, and must be maintained forever.

**Target state:** The repository contains only novel business logic and domain-specific code. All standard operations, protocols, parsing, and transformations are delegated to authoritative libraries and runtime primitives.

## Invariant Rules

1. **Reuse Before Writing**: If an existing standard library function or battle-tested dependency exists, use it.
2. **Ban Thin Passthrough Wrappers**: Do not write a custom wrapper whose only job is to call another function with identical parameters. Call the underlying function directly at the call site.
3. **Only Implement What Is Missing**: Extend existing libraries through their official plugin or options APIs rather than re-implementing their entire pipeline from scratch.
4. **Pin Strict Latest Stable Versions**: When introducing a verified external package, query the package registry and pin the latest stable release.

## Execution Workflows

- [`find-existing`](usecases/find-existing.md): Systematic procedure to search standard libraries, repository dependencies, and package registries before coding.

## Domain References

- [`canonical-libraries`](references/canonical-libraries.md): Curated catalog of authoritative packages and standard runtime primitives.

## Delegated Skills

- `poteto-principles`: Follow `subtract-before-you-add` and `build-the-lever`.
- `anti-slop-engineering`: Follow Gate 0 (Discover, do not improvise) and Gate 3 (Implement with minimum justified complexity).
