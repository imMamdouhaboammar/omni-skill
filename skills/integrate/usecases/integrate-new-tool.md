# Integrate New Tool: Adoption, Migration, and Deprecation Lockout

Operational workflow for introducing a new library or structural pattern.

1. **Audit Existing Usage**: Enumerate every file, module, and call site currently implementing the target behavior.
2. **Install & Verify the New Tool**: Add the canonical latest stable package and verify that its API meets all functional requirements.
3. **Establish the Single Canonical Pattern**: Write one clear reference implementation or helper function that defines the standard usage.
4. **Migrate Existing Callers**: Sequentially update all existing call sites to the new pattern. Verify with tests after each batch.
5. **Install Structural Enforcement**: Configure a linter rule (e.g. ESLint `no-restricted-imports`, Biome, or Python AST check), compiler constraint, or pre-commit hook that fails if the deprecated API is imported or called.
6. **Delete Legacy Implementations & Dependencies**: Remove the old utility functions, wrappers, and unused packages from manifests (`package.json`, `pyproject.toml`) and regenerate the lockfile.
7. **Verify Zero Legacy Traces**: Run codebase searches to ensure zero references to the old pattern remain.
