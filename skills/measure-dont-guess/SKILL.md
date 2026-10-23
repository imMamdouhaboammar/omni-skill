---
name: measure-dont-guess
description: Establish hypotheses and measurable verification criteria before implementing changes or diagnosing bugs, and decide strictly based on measured outcomes. Use when investigating bug causes, comparing performance, optimizing latency, choosing between architectures, or whenever tempted to make decisions based on guesswork.
metadata:
  derived-from: https://github.com/masseater/skills/tree/main/skills/measure-dont-guess
---

# measure-dont-guess

A strict operational rule to replace guesswork with empirical measurement.

## Why This Skill Is Needed & Target State

**Why this skill is needed:** Guesswork produces plausible-sounding explanations much faster than measuring. However, changes made based on guesswork cannot distinguish whether a successful outcome was caused by the change or by mere coincidence. When guesswork fails, it leaves no audit trail or data for the next engineer or agent.

**Target state:** Every engineering judgment, architectural decision, and bug diagnosis is anchored in reproducible, empirical measurements with explicit before-and-after baselines.

## Invariant Rules

1. **State the Hypothesis and Threshold Before Measuring**: Define the expected numeric threshold or falsifiable criterion before running any test or benchmark. Never interpret raw data post-hoc to justify a preexisting bias.
2. **Measure Under Real or Production-Equivalent Conditions**: Measure in the actual execution environment or a matched staging setup. Local approximations with unrepresentative data scale can produce the opposite conclusion of production.
3. **Explicitly Label Unmeasured Claims as Guesswork**: If an assertion has not been measured directly, state explicitly: "This is an unmeasured hypothesis."
4. **Halt When Measurement Is Blocked**: If measurement is impossible due to missing tools or environment variables, do not proceed blindly on guesses. State what observation mechanism is missing.
5. **Cite the Bound**: Always explain what resource or constraint bounds the measured number ("why not double?") per `explain-the-number`.

## Execution Workflows

Follow the dedicated operational playbooks in [`usecases/`](usecases/):

- [`measure`](usecases/measure.md): Formulate a falsifiable hypothesis, design the observation point, and measure.
- [`find-root-cause`](usecases/find-root-cause.md): Trace defects to their root cause using reproducible evidence before writing code.
- [`improve-performance`](usecases/improve-performance.md): Benchmark bottlenecks iteratively, isolate single variables, and verify latency/throughput improvements.

## Domain References

- [`benchmark-patterns`](references/benchmark-patterns.md): Statistical profiling, warm-up runs, and anomaly elimination.

## Delegated Skills

- `poteto-principles`: Follow `explain-the-number`, `fix-root-causes`, and `prove-it-works`.
- `anti-slop-engineering`: Follow Gate 4 (Verify beyond green tests).
