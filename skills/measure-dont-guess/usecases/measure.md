# Measure: Formulate Hypothesis and Decide by Evidence

Operational procedure for testing hypotheses empirically before code changes.

1. **State One Question Answerable by Fact**: Frame the problem so that a direct measurement settles the question (e.g., "Does caching AST parsing reduce CLI startup time below 50ms?").
2. **List Candidate Hypotheses**: Name all plausible explanations without prematurely favoring one.
3. **Define Acceptance and Rejection Thresholds Before Measuring**: For each hypothesis, write down the numeric threshold that proves or disproves it *before* running tests. This prevents subjective post-hoc rationalization.
4. **Calibrate the Instrumentation**: Verify that your measuring probe or script produces known values on a deterministic control input.
5. **Vary One Variable at a Time**: Run multiple iterations to capture variance, standard deviation, and outliers.
6. **Record the Raw Evidence**: Preserve exact command lines, input payloads, environment details, and raw output numbers in your verification notes.
7. **Evaluate Against Predefined Criteria**: If the numbers contradict your hypothesis, reject it and investigate the next hypothesis.
8. **Re-measure After Implementation**: Run the identical measurement script post-change to confirm the improvement holds.
