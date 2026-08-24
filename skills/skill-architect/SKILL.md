---
name: skill-architect
description: >
  Architect a new agent Skill or convert an existing prompt, SOP, playbook, runbook, workflow, or repeated agent behavior into a durable Skill. Use when the main problem is deciding what the Skill should contain, how it should activate, which architecture and freedom levels fit, and how to separate instructions, references, scripts, and host adapters. Do NOT use when the user only wants to run an existing Skill or only wants behavioral evaluation of an already-frozen Skill.
---

# Skill Architect

Turn repeated agent work into a behaviorally specified Skill before writing host syntax

## Required inputs

Extract from the request or source material:

- recurring user job
- primary user
- realistic trigger prompts
- close negatives
- desired outcome
- current failure or inconsistency
- consequences of mistakes
- required tools or data
- target hosts, if any

Do not force the user to answer fields that can be inferred safely from supplied material. Mark uncertain assumptions

## Step 1: Decide whether a Skill is justified

A Skill is justified when at least one durable behavior is missing or unreliable:

- specialized knowledge
- stable decision policy
- workflow order or gates
- recurring preference
- deterministic mechanic
- tool-selection rule
- cross-tool coordination pattern

If the base agent already does the job reliably and no durable behavior is added, recommend not creating a Skill

## Step 2: Create the Universal Skill Contract

Use `../skill-conductor/references/skill-contract.md`

Freeze:

- one job
- positive triggers
- implicit triggers
- negative triggers
- collision set
- behavior preconditions
- decision points
- evidence requirements
- completion and stop conditions
- mutation boundary
- capability requirements
- evaluation coverage

## Step 3: Choose architecture

Use `../skill-conductor/references/patterns.md`

Pick the main control pattern before drafting prose

If the Skill has several independent jobs, split it into multiple Skills and define routing rather than building a monolith

## Step 4: Set freedom per behavior

For each important behavior record:

`behavior | consequence | reversibility | verifiability | freedom | implementation form`

Use scripts or schemas for low-freedom mechanics
Use decision tables or constrained pseudocode for medium freedom
Use prose guidance where judgment is the value

## Step 5: Design activation

Build an activation bank before finalizing the description

Include:

- 4 to 8 positive prompts
- 2 to 4 implicit prompts
- 4 to 8 close negative prompts
- neighboring Skill collisions

The description should expose the job and routing boundary, not the workflow sequence

## Step 6: Design the information shape

Keep frequently needed operating instructions in `SKILL.md`
Move deep domain material into `references/`
Move fragile repeated mechanics into `scripts/`
Keep generated-output assets in `assets/`

A reader should be able to understand the Skill's control flow without loading every reference

## Step 7: Author the first candidate

Use imperative instructions
Explain why a non-obvious gate exists
Place checks at the point of risk
Use one term per concept
State evidence requirements before consequential claims or mutations
State completion conditions explicitly

Do not include credentials, private absolute paths, or assumed host tool names in the portable core

## Step 8: Produce the evaluation blueprint

Before calling the Skill complete, hand off:

- no-Skill baseline cases
- activation positives
- activation negatives
- core behavior cases
- edge cases
- pressure cases where relevant
- host-portability cases where relevant
- critical binary questions

Route these to `skill-evaluator`

## Output contract

Return:

1. Skill rationale
2. Universal Skill Contract
3. architecture decision
4. freedom map
5. proposed package tree
6. first candidate Skill content or patch
7. evaluation blueprint
8. unresolved assumptions

Do not report behavioral validity until tests actually run
