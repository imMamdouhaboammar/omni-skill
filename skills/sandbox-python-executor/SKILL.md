---
name: sandbox-python-executor
description: Use when a Skill Conductor workflow needs deterministic computation, file generation, parsing, package inspection, hashing, or validation that should be actually executed with host-native Python.
---

# Sandbox Python Executor

Use the host's Python capability to produce evidence instead of simulating execution.

Use Python for:

- parsing JSON or manifests
- generating deterministic skill scaffolds
- checking paths and file trees
- package/archive inspection
- hashes
- structured transformations
- running the bundled standard-library portability scripts

Do not use Python merely to imitate a safer read/search operation.

Execution rules:

1. Actually execute the relevant code before claiming a result
2. Prefer bundled reviewed scripts when they already cover the check
3. Keep repository access read-only unless mutation is authorized
4. Inspect untrusted target scripts before running them
5. Do not assume sandbox internet access
6. Do not expose credentials or unrelated user files
7. Preserve generated artifacts the user needs
8. Report the operation, pass/fail status, important output, and hash/path when relevant

If Python is unavailable, keep execution-dependent claims unverified. Do not invent an MCP server or manifest field to pretend Python exists.
