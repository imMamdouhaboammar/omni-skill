# Benchmark Patterns & Measurement Hygiene

Best practices for reproducible benchmarking in agent and software systems.

## Key Hygiene Rules

1. **Warm-up Runs**: Always execute 2-3 unmeasured iterations before recording metrics to allow JIT compilation, disk cache warm-up, and module loading to stabilize.
2. **Multiple Samples & Spread**: Take at least 5-10 runs. Report median and p95/p99 values rather than a single cherry-picked run.
3. **Environment Isolation**: Ensure heavy background tasks, disk indexing, and thermal throttling are eliminated or accounted for during execution.
4. **Falsifiable Counters**: Track concrete counts (e.g. disk read operations, network roundtrips, heap bytes allocated) in addition to elapsed clock time.
