# No Perishable Information

Do not duplicate facts in prose that can be derived directly from source code, configuration files, or package manifests.

## The Problem
When documentation restates version numbers, function arguments, file lists, or configuration keys, the code inevitably evolves while the documentation remains stale. Readers then waste time resolving contradictions between text and reality.

## Guidelines
1. **Reference, Do Not Duplicate**: Point to authoritative schemas, type declarations, or manifests rather than copying their contents into markdown tables.
2. **Document Invariants, Not Ephemeral States**: Document architectural rules, failure semantics, and security boundaries. Leave exact function signatures to the compiler and language server.
3. **Delete Stale Commentary**: If a comment or docstring merely paraphrases the name or return type of a function, delete it per `subtract-before-you-add`.
