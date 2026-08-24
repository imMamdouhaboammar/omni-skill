---
name: skill-portability-compiler
description: >
  Port an agent Skill across ChatGPT, Codex, Claude, API agents, or another compatible host without losing its decision logic, evidence gates, activation boundary, or completion conditions. Use when a Skill is tied to one vendor's paths, tool names, keys, hooks, subagents, packaging, or runtime assumptions and needs a portable core plus host adapters. Do NOT claim a host is behaviorally supported unless that host was actually tested.
---

# Skill Portability Compiler

Separate behavior from host mechanics, then adapt only what truly differs

## Step 1: Extract the portable core

Read the source Skill and classify each element as:

- activation metadata
- behavioral rule
- domain knowledge
- decision policy
- evidence gate
- deterministic mechanic
- reference material
- host-specific syntax
- environment assumption
- packaging metadata

Preserve the first seven in the portable core unless they are unsafe or obsolete

## Step 2: Find host coupling

Search for:

- vendor names in required instructions
- hard-coded tool function names
- fixed install paths
- environment variables
- required API keys
- hook syntax
- subagent syntax
- model-family assumptions
- package/manifest fields
- shell commands that presume one runtime

For each coupling ask: does the user job require this, or is it only one implementation path

Move implementation-only coupling into an adapter

## Step 3: Build the capability matrix

Read `../skill-conductor/references/host-adapters.md`

For every target host record:

- capability required by the Skill
- capability known to exist
- evidence source
- adapter needed
- fallback behavior
- test status

Unknown is not supported

## Step 4: Compile adapters

Keep adapters small

An adapter may define:

- installation layout
- manifest metadata
- invocation or lifecycle conventions
- mapping from abstract capability to real host tool
- script runtime differences
- resource loading differences

Do not copy the entire core into every adapter

## Step 5: Remove false dependencies

A valid portable Skill must not require:

- an Anthropic key only because one historical evaluator used Anthropic
- `uv`, Node, Bun, or Python unless the actual Skill job needs that runtime
- filesystem or shell permissions merely because one host offered them
- MCP when instructions and host-native tools are sufficient

If a deterministic helper genuinely requires a runtime, declare it as a capability requirement and provide an honest fallback or unsupported status

## Step 6: Re-test activation and behavior

Structural translation is insufficient

For every target host claimed as tested, rerun:

- positive activation
- negative activation
- critical behavior assertions
- failure paths
- pressure cases where relevant

Record host and model details when exposed

## Step 7: Assign host status

Use exactly one:

- `SUPPORTED_TESTED`
- `SUPPORTED_STRUCTURAL_ONLY`
- `ADAPTER_REQUIRED`
- `UNSUPPORTED`
- `UNKNOWN`

If only static translation was done, use `SUPPORTED_STRUCTURAL_ONLY`

## Output contract

Return:

1. portable core summary
2. removed host assumptions
3. capability matrix
4. adapter files or patch plan
5. behavior preserved checklist
6. host-by-host test evidence
7. portability status per host
8. unresolved gaps
