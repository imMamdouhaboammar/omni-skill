# AgentSkills.io v1 Specification Reference

Authoritative structure and metadata schema for modern agent skills.

## Metadata Schema (YAML Frontmatter)
```yaml
---
name: string            # Required. Lowercase alphanumeric and hyphens: ^[a-z0-9]+(?:-[a-z0-9]+)*$
description: string     # Required. Explains what the skill does AND when it triggers.
metadata:               # Optional. Upstream lineage, authors, versioning.
  version: string
  derived-from: string  # Permalinks to upstream origin
---
```

## Directory Hierarchy
```
<skill-name>/
├── SKILL.md            # Primary agent entrypoint
├── usecases/           # Procedural playbooks
├── references/         # Deep domain knowledge
├── scripts/            # Deterministic automation levers
└── evals/              # BinEval evaluation sets
```
