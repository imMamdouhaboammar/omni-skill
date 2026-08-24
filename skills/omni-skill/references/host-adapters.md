# Host Adapters

Keep the Skill's behavioral core host-neutral. Add an adapter only when a host changes loading, installation, tool naming, packaging, or execution semantics.

## Capability profile

Build this table for every claimed host:

| Capability | Required by Skill | Host provides | Adapter needed | Fallback |
|---|---:|---:|---:|---|
| instruction loading | yes/no | yes/no/unknown | yes/no | behavior |
| supporting references | yes/no | yes/no/unknown | yes/no | behavior |
| bundled scripts | yes/no | yes/no/unknown | yes/no | behavior |
| filesystem read | yes/no | yes/no/unknown | yes/no | behavior |
| filesystem mutation | yes/no | yes/no/unknown | yes/no | behavior |
| command execution | yes/no | yes/no/unknown | yes/no | behavior |
| deterministic computation | yes/no | yes/no/unknown | yes/no | behavior |
| web research | yes/no | yes/no/unknown | yes/no | behavior |
| connected private data | yes/no | yes/no/unknown | yes/no | behavior |
| external actions | yes/no | yes/no/unknown | yes/no | behavior |

Do not mark unknown capabilities as supported.

## OpenAI Skills adapter

OpenAI Skills follow the Agent Skills open standard and can be used in ChatGPT, Codex, and the API. Keep a standard Skill directory with `SKILL.md` plus optional supporting resources. A ChatGPT/Codex Plugin may package one or more Skills.

For a Skills-only Plugin:

- keep `.codex-plugin/plugin.json` as the Plugin manifest
- keep intended public Skills as immediate child directories under `skills/`
- keep host-native workspace actions in Skill instructions rather than inventing manifest dependencies
- include external apps or MCP only when the product truly needs connected external data or actions

## Claude-compatible adapter

Treat Claude-specific plugin metadata, subagent spawning syntax, environment assumptions, or command names as an adapter, not as the universal Skill definition.

A portable Skill must not require an Anthropic API key merely to be valid. If a particular evaluator implementation uses Anthropic models, describe that as one optional executor path and retain a host-neutral evaluation contract.

## Generic agent adapter

When the target agent does not implement the full Agent Skills package shape:

1. preserve the activation contract
2. preserve the behavioral contract
3. preserve references and scripts when the host supports them
4. map capabilities to the host's real tools
5. disclose unsupported capabilities
6. re-run activation and behavioral tests on that host

## Adapter quality rules

Reject an adapter when it:

- copies the entire portable core instead of referencing it
- changes the user job
- silently removes gates or evidence requirements
- claims a host capability without evidence
- embeds user-specific absolute paths
- requires credentials unrelated to the Skill's actual job
- reports untested compatibility as tested support

## Portability status

Use one status per host:

- `SUPPORTED_TESTED`
- `SUPPORTED_STRUCTURAL_ONLY`
- `ADAPTER_REQUIRED`
- `UNSUPPORTED`
- `UNKNOWN`

Do not collapse these into a single "works everywhere" claim.
