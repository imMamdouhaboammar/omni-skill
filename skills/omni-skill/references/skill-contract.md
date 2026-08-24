# Universal Skill Contract

Use this contract before authoring host-specific syntax. It separates the behavior a Skill must cause from the mechanics a particular agent host uses to load or execute it.

## 1. Skill identity

Record:

- canonical name
- one recurring user job
- primary user
- problem the base agent fails at or performs inconsistently
- non-goals
- expected lifetime of the guidance

Reject a Skill that tries to own several unrelated jobs.

## 2. Activation contract

Define four sets:

1. `positive_triggers`: realistic user phrasings that should activate the Skill
2. `implicit_triggers`: requests that need the behavior without naming the Skill or domain term
3. `negative_triggers`: close-looking requests that should not activate it
4. `collision_set`: neighboring Skills or generic agent abilities that could compete for the same request

A good description is discovery metadata, not a compressed procedure. Keep workflow steps out of activation text.

## 3. Behavioral contract

For every important behavior specify:

- precondition
- action or decision
- evidence required before the action
- output or state change
- failure behavior
- completion condition

If the Skill mutates state, separate discovery from mutation and state what authorization is required.

## 4. Knowledge contract

Classify every instruction as one of:

- `new_knowledge`: the base agent is unlikely to know it reliably
- `decision_policy`: the agent may know the pieces but needs a stable choice rule
- `workflow_order`: the value comes from sequence or gates
- `preference`: a user or organization preference
- `deterministic_mechanic`: should be a script, schema, or checker when practical
- `reference_only`: useful detail loaded on demand

Remove content that merely restates generic model competence without changing behavior.

## 5. Freedom contract

Calibrate freedom per step, not per Skill:

- `low`: exact script/schema/check when mistakes are costly or mechanical
- `medium`: constrained pseudocode, decision table, or template
- `high`: judgment-heavy work with several acceptable answers

Use consequence, reversibility, and verifiability to choose the level.

## 6. Tool capability contract

Describe capabilities, not vendor tool names, whenever possible:

- read
- list
- search
- exact grep/lookup
- write
- patch
- shell/command execution
- deterministic Python or equivalent computation
- web/public research
- connected private data
- external action

For each capability mark `required`, `optional`, or `not_allowed`.

A Skill never grants a capability. The active host must supply it. If unavailable, the Skill must degrade honestly instead of fabricating execution.

## 7. Evidence contract

A claim is one of:

- `observed`: produced by an executed tool/run
- `derived`: deterministically calculated from observed evidence
- `inferred`: reasoned but not directly verified
- `proposed`: future work or an unexecuted test

Never report `proposed` as `observed`.

## 8. Evaluation contract

Create evaluation coverage before declaring the Skill complete:

- baseline cases without the Skill
- positive activation cases
- negative activation cases
- core behavior cases
- edge cases
- pressure cases for brittle discipline rules
- host-portability cases when more than one host is supported
- regression cases for previously fixed failures

Keep train and held-out cases separate when improving a Skill from evidence.

## 9. Portability contract

Split the Skill into:

### Portable core

The host-neutral job, decision logic, gates, schemas, examples, and completion conditions

### Host adapter

Only the syntax or mechanics that differ by host, such as install path, manifest, tool invocation names, or lifecycle hooks

Never duplicate the portable core into every adapter. Duplication causes drift.

## 10. Release contract

Before packaging, record:

- version
- supported hosts
- tested hosts
- untested hosts
- required capabilities
- executed checks
- known limitations
- deterministic package hash when packaging tools are available

A Skill may be structurally valid while still lacking behavioral proof. Keep those states separate.
