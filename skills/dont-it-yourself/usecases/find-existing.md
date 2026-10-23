# Find Existing: Ecosystem Package & Runtime Discovery

Operational procedure to locate and evaluate existing solutions before writing custom code.

1. **Check Runtime Primitives First**: Inspect modern runtime standard APIs (e.g. `node:fs`, `node:crypto`, `Bun.file`, `fetch`, `structuredClone`, `URLPattern`). Many helpers that previously required external dependencies are now built into modern runtimes.
2. **Inspect Existing Repository Dependencies**: Search `package.json` and lockfiles to identify packages already installed and configured in the project.
3. **Query Standard Specifications**: For standard data formats (e.g., CSV, YAML, TOML, Markdown, JWT, OAuth, SemVer, Cron, Tar, Zip, RFC formats), assume an authoritative specification-compliant library exists on the package registry.
4. **Evaluate Candidate Packages**: When multiple candidates exist, select based on:
   - Active maintenance and community trust
   - First-class TypeScript type definitions
   - Zero or minimal transitive dependencies
   - Permissive license (MIT, Apache 2.0, BSD)
5. **Inspect Package Manifests Directly**: Review package documentation and exports directly rather than relying on brief summary snippets that may omit built-in functions.
