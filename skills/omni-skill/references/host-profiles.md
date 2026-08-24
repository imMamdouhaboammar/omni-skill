# Host profiles

Use host profiles to translate a universal SkillSpec into executable behavior without pretending all agents expose the same tools.

A profile records capabilities and packaging rules. It is not a marketing comparison.

## Profile fields

For every target host, record:

```text
discovery
skill_format
package_format
metadata
read
list
search
grep
write_patch
shell
python
subagents
network
approval_behavior
trigger_evidence
install_evidence
```

Use one of these values for operational capabilities:

- `available`
- `host-dependent`
- `unavailable`
- `unknown`

Add notes when the distinction affects the workflow.

## Agent Skills baseline

Use this when the exact product host is unknown or when you want the most portable source artifact.

- `discovery`: host-defined
- `skill_format`: folder with `SKILL.md` plus optional scripts/references/assets
- `package_format`: host-defined; standalone skill bundle when supported
- `metadata`: Skill frontmatter, especially name and description
- operational capabilities: host-dependent
- `trigger_evidence`: unavailable until a real host is tested
- `install_evidence`: unavailable until a real host is tested

Design implication: keep the body provider-neutral. Name required capabilities rather than tool identifiers.

## ChatGPT

OpenAI Skills follow the Agent Skills standard. A ChatGPT/Codex Plugin may package one or more Skills.

- `discovery`: ChatGPT Skill/Plugin discovery and invocation
- `skill_format`: Agent Skills-compatible Skill folder
- `package_format`: ChatGPT/Codex Plugin when distributed as a Plugin
- `metadata`: Skill frontmatter plus Plugin manifest when packaged
- `read/list/search/grep`: use host-native capabilities when exposed
- `write_patch`: use only when the host exposes a mutation capability and the user authorized the change
- `shell`: surface-dependent
- `python`: use host-native Python when available
- `subagents`: surface-dependent
- `network`: surface and tool dependent
- `approval_behavior`: honor host/plugin/app confirmation policy
- `trigger_evidence`: observe actual Skill/Plugin use on ChatGPT; do not infer from Claude or Codex
- `install_evidence`: actual installation or listing on a supported ChatGPT surface

Plugin root when packaging:

```text
.codex-plugin/
  plugin.json
skills/
  <skill>/SKILL.md
assets/              # optional
```

Only `plugin.json` belongs inside `.codex-plugin/`.

A skills-only Plugin does not require MCP. Add an MCP server only when external services, controlled remote tools, authentication, or hosted behavior are actually required.

## Codex

Codex can consume Skills and ChatGPT/Codex Plugins. Repository work commonly has stronger local workspace capabilities than ordinary chat surfaces, but never assume a specific capability without observing the current host.

- `discovery`: Codex Skill/Plugin discovery
- `skill_format`: Agent Skills-compatible Skill folder
- `package_format`: ChatGPT/Codex Plugin for Plugin distribution
- `metadata`: Skill frontmatter plus `.codex-plugin/plugin.json` when packaged
- `read/list/search/grep`: commonly available in repository contexts; verify current surface
- `write_patch`: mutation boundary; preserve unrelated changes
- `shell`: host/sandbox dependent
- `python`: host/sandbox dependent
- `subagents`: host/version dependent
- `network`: governed by sandbox and approval policy
- `approval_behavior`: follow current Codex sandbox/approval settings
- `trigger_evidence`: observe actual Codex invocation
- `install_evidence`: actual Plugin/Skill install on the target Codex surface

Do not hard-code a particular Codex tool recipient into the universal Skill. Route by capability.

## Claude Code

The repository retains a Claude-specific distribution and discovery runner.

- `discovery`: Claude Code Skill/plugin discovery
- `skill_format`: Skill folder
- `package_format`: `.claude-plugin/` distribution metadata when used as a Claude plugin
- `read/list/search/grep`: Claude Code toolset dependent
- `write_patch`: host toolset and permission dependent
- `shell`: typically available through Claude Code tooling, subject to permissions
- `python`: local environment dependent
- `subagents`: Claude Code capability dependent
- `network`: environment and permission dependent
- `approval_behavior`: Claude Code permission model
- `trigger_evidence`: Claude-specific runner may observe Skill/Read events
- `install_evidence`: actual Claude plugin/skill install

`run_eval.py` in this repository is a Claude Code adapter. It writes `.claude/commands` entries and invokes `claude -p`. Its result is evidence for Claude Code only.

## Custom or unknown host

Use `custom:<name>` in SkillSpec.

Before adapting, answer:

1. How are Skills discovered?
2. What is the required folder/file format?
3. Which metadata fields control discovery?
4. Can the agent read/list/search/grep local or connected resources?
5. Can it mutate files or external state?
6. Does it expose shell or deterministic code execution?
7. Are subagents or parallel runs available?
8. What network access exists?
9. What approvals/confirmations constrain actions?
10. What observable event proves the Skill was invoked?

If these are unknown, compile the portable Skill and return a gap list. Do not invent an adapter.

## Portability mapping

For each source-host behavior, assign one disposition:

- `preserve`: universal behavior works unchanged
- `translate`: same behavior, different host mechanism
- `replace`: target needs a different mechanism
- `optional`: useful but not necessary on target
- `remove`: source-only behavior should disappear
- `gap`: target capability is missing or unknown

A port is complete only when target-host evals cover translated/replaced behavior and every gap is explicit.
