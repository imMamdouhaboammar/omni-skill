---
name: integrate
description: Protocol for adopting a new library, tool, or architectural pattern. Ensures that introduction does not stop at installation, but mandates full migration of existing call sites, mechanical enforcement preventing legacy usage, standardization on a single pattern, and deletion of deprecated code. Use when adding or replacing dependencies, frameworks, utilities, or architectural standards.
metadata:
  derived-from: https://github.com/masseater/skills/tree/main/skills/integrate
---

# integrate

A strict protocol to complete migrations, eliminate legacy duality, and mechanically enforce the new standard.

## Why This Skill Is Needed & Target State

**Why this skill is needed:** When a new library or tool is introduced without full integration, the legacy pattern remains operational. Engineers and agents default to familiar legacy habits or copy nearby outdated code. Relying on human vigilance or review comments to enforce adoption is ineffective: rules maintained solely by goodwill do not exist in practice. As a result, old and new implementations coexist indefinitely, confusing readers and doubling maintenance overhead.

**Target state:** Only the new standard is used across the codebase, and the legacy approach cannot be used even accidentally because mechanical guardrails (linters, type boundaries, or removal) forbid it.

## Invariant Rules

1. **Migrate All Existing Callers in the Same Wave**: Migrate all existing occurrences to the new standard per `migrate-callers-then-delete-legacy-apis`. Never leave partial migrations for a future speculative phase.
2. **Mechanically Enforce the Boundary**: Prevent new code from using the deprecated method using structural gates (lint rules like `no-restricted-imports`, compiler type constraints, or CI checks), never through documentation warnings alone per `encode-lessons-in-structure`.
3. **Standardize on One Canonical Pattern**: Converge on exactly one way to invoke the new tool so readers do not seek phantom significance in syntax variations.
4. **Delete Deprecated Implementations & Dependencies**: Completely excise obsolete functions, dead shims, and unused dependencies from manifests and lockfiles per `subtract-before-you-add`.

## Execution Workflows

- [`integrate-new-tool`](usecases/integrate-new-tool.md): Step-by-step workflow for adopting a dependency, migrating call sites, and locking the gate.

## Domain References

- [`mechanical-enforcement`](references/mechanical-enforcement.md): Linters, compiler barriers, and CI assertions that lock out deprecated patterns.

## Delegated Skills

- `poteto-principles`: Follow `migrate-callers-then-delete-legacy-apis`, `encode-lessons-in-structure`, and `subtract-before-you-add`.
- `dont-it-yourself`: Confirm that the incoming tool replaces custom home-rolled code.
