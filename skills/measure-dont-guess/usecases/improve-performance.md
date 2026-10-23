# Improve Performance: Bottleneck Elimination

Procedure for optimizing throughput, latency, or memory consumption using empirical gates.

1. **Profile First**: Instrument the target function with spans or high-resolution timers (`performance.now()`) to identify the dominant bottleneck. Record the pre-optimization baseline.
2. **Apply One Targeted Optimization**: Implement a single, focused improvement addressing the identified bottleneck.
3. **Re-measure Under Identical Conditions**: Re-run the benchmark using the exact same load and hardware profile. If latency or throughput fails to improve beyond the noise threshold, revert the edit and test the next candidate.
4. **Audit for Unintended Regressions**: Measure adjacent code paths and resource consumption (e.g. memory spikes caused by caching) to ensure improvements in one metric did not degrade another.
5. **State the Physical Bound**: Name the limiting factor ("why not double?") per `explain-the-number`.
