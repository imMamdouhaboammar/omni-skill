---
name: skill-evaluator
description: >
  Evaluate an agent Skill for activation accuracy, instruction compliance, outcome quality, efficiency, pressure resistance, and regression risk. Use when testing a new Skill, diagnosing an unreliable Skill, comparing versions, validating a claimed improvement, creating held-out evals, or deciding whether a Skill is behaviorally ready. Do NOT use as a substitute for actually executing tests when the active host cannot run them.
---

# Skill Evaluator

Judge Skills from evidence, not visual neatness or confidence

## Evidence states

Every result must be one of:

- `OBSERVED`: produced by an executed run
- `DERIVED`: deterministically computed from observed evidence
- `INFERRED`: reasoned from static material
- `PROPOSED`: test not yet executed

Never convert `PROPOSED` or `INFERRED` into a pass

## Evaluation dimensions

Evaluate independently:

1. Discovery: correct activation and non-activation
2. Clarity: instructions lead to unambiguous important behavior
3. Structure: context is placed and loaded appropriately
4. Robustness: behavior survives edge cases and pressure
5. Completeness: critical preconditions, gates, evidence, failures, and completion conditions exist
6. Outcome: the result actually satisfies the user job
7. Efficiency: the Skill does not add needless work or context
8. Portability: host claims match tested or structurally verified capability

Use existing BinEval questions from `../skill-conductor/references/quality-questions.md` and method rules from `../skill-conductor/references/bineval-method.md` when applicable

## Step 1: Freeze the candidate

Record the exact Skill version or content hash before testing
Do not edit the candidate while collecting baseline results

## Step 2: Build the test bank

Include:

- positive activation
- implicit activation
- close negatives
- collision cases
- core behavior cases
- edge cases
- failure-path cases
- pressure cases for discipline rules
- regressions for previously fixed failures
- host-specific cases for every claimed tested host

Critical behavior must have explicit binary assertions

## Step 3: Establish a baseline

For CREATE, use the same prompts without the Skill when executable
For IMPROVE, use the frozen parent version

Run comparison cases close enough in time and environment to reduce drift

If isolation cannot be provided, disclose the limitation

## Step 4: Execute with evidence

Use the active host's real execution capabilities

Capture at minimum:

- prompt
- Skill version
- host/model when known
- output
- relevant tool evidence
- assertion results
- failure notes
- timing/token data when exposed

Do not invent unavailable telemetry

## Step 5: Critique before verdict

For every binary question:

1. cite the relevant evidence
2. explain the failure or success briefly
3. only then assign yes/no

Keep the overall gate hidden from the per-question judge when possible so threshold knowledge does not bias answers

## Step 6: Run pressure tests

Read `../skill-conductor/references/pressure-testing.md`

For brittle rules, create scenarios with competing incentives such as speed, user insistence, ambiguity, prior investment, convenience, or apparently harmless exceptions

Match remediation form to failure class

## Step 7: Control variance

Do not treat one noisy flip as a durable improvement

For important borderline cases, reproduce the result in fresh context
For candidate edits, require regression checks against held-out cases

## Step 8: Gate improvements

A candidate improvement is accepted only when:

- no new critical failure appears
- held-out assertions do not reproducibly regress
- targeted train failures improve
- the edit does not create a new activation collision

Prefer at most three atomic edits per iteration so cause and effect remain attributable

## Step 9: Compare versions blindly when useful

For large changes, present outputs as A/B without version labels to a comparator
Judge the same binary outcome questions for both
Unblind only after the verdict

## Output contract

Return:

- exact candidate identifier
- execution coverage
- unexecuted coverage
- per-dimension results
- critical failures
- activation false positives/negatives
- regression transitions
- variance warnings
- accepted/rejected improvement verdict when evidence supports it
- next smallest edit targets

Use status `STRUCTURAL_ONLY` when no behavioral tests were executed
