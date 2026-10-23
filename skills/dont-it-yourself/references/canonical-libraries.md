# Canonical Libraries & Modern Runtime Primitives

Reference mapping of common tasks to canonical packages and standard APIs.

## Common Task to Standard Solution Mapping

| Task | Modern Runtime / Canonical Package | Anti-Pattern to Avoid |
| --- | --- | --- |
| UUID / ULID | `crypto.randomUUID()` | Custom random string generator |
| Object Deep Clone | `structuredClone()` | Custom recursive clone function |
| CLI Parsing | `commander`, `cac` | Custom `process.argv` slicing |
| Terminal Colors | `picocolors` | Manual ANSI escape codes |
| Schema Validation | `zod`, `valibot` | Ad-hoc manual type-guard conditionals |
| YAML Parsing | `yaml` | Homegrown regex parser |
| HTTP Requests | `fetch` (native standard) | Outdated `request` / manual socket code |
| URL Handling | `new URL()`, `URLSearchParams` | Manual string concatenation & regex |
| Path Manipulation | `node:path` (`join`, `resolve`) | String replacement with `/` or `\` |
| Cryptography & Hashing | `node:crypto` (`createHash`) | Custom hash / checksum algorithms |
| Archive / Tar / Zip | `archiver`, `tar` | Executing ad-hoc shell `zip` commands |
