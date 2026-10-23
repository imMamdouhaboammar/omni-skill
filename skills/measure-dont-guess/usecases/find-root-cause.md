# Find Root Cause: Systematic Defect Investigation

Procedure for diagnosing the true cause of a defect rather than suppressing symptoms.

1. **Read Entire Error Messages and Stack Traces**: Pay close attention to inner causes and origin lines rather than skimming the top line.
2. **Construct a Minimal Reproducible Case**: Do not edit code until a deterministic script or test fails reliably on the defect.
3. **Inspect the Recent Change Ledger**: Audit recent commits, dependency bumps, environment shifts, and lockfile diffs.
4. **Instrument Across Layer Boundaries**: For multi-layer processing (e.g., CLI -> Core Parser -> AST -> Compiler -> Disk), log inputs and outputs at each boundary to locate which layer produces the divergence.
5. **Trace Invalid Values to Their Point of Origin**: When a value is wrong or corrupted, traverse callers back to the boundary where the corrupted value was admitted.
6. **Compare Against Working Counterparts**: Identify similar features that work correctly in the codebase and enumerate all behavioral differences.
7. **Write the Failing Regression Test First**: Prove the reproduction before writing the fix.
8. **Keep the Fix Isolated**: Do not mix opportunistic refactoring or styling changes into the bugfix commit.
9. **Circuit Breaker**: If three fix attempts fail to resolve the defect, stop and question the underlying architectural premise (`attack-the-premise`).
