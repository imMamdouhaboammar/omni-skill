---
name: omni-skill
description: >
  Design, architect, evaluate, port, and package high-reliability agent skills across ChatGPT, Codex, Claude Code, Google Antigravity, and Agent Skills hosts. Use when a user wants a new reusable skill, wants an existing skill made more reliable, needs trigger or behavior evals, wants a skill adapted to another agent host, or needs a distributable skill/plugin package.
---

# OmniSkill

Build skills as tested behavioral artifacts, not polished prompt files.

The invariant is:

**failure evidence -> SkillSpec -> host contract -> implementation -> evals -> gate -> package**

Do not claim a skill is portable or production-ready until the target host was identified and the applicable gates were actually run.

## Start here

For every request, establish these four facts before editing:

1. **Job**: the repeatable task the skill must improve
2. **Failure**: what the target agent does wrong without the skill
3. **Host**: where the skill must run
4. **Evidence**: how success and non-trigger behavior will be checked

If the host is unspecified, target the Agent Skills baseline and mark host-specific behavior as unresolved rather than inventing it.

Read only what the mode needs:

- `references/skill-spec.md` for CREATE, IMPROVE, or PORT
- `references/host-profiles.md` when selecting or adapting a host
- `references/sop-practices.md` before authoring or reviewing skill instructions
- `references/pressure-testing.md` for wording micro-tests and discipline skills
- `references/bineval-method.md` and `references/quality-questions.md` for scoring
- `references/cross-host-evaluation.md` for multi-host evidence
- `references/runtime-setup.md` before executing scripts or runners

## Mode router

| Mode | Use when | Primary result |
| --- | --- | --- |
| CREATE | build a new skill | SkillSpec + implementation + eval set |
| IMPROVE | existing skill is weak or unreliable | smallest evidence-backed edits |
| VALIDATE | test a skill | structural, discovery, behavior, and portability evidence |
| REVIEW | assess a third-party skill | pass/fail risks before installation |
| OPTIMIZE | trigger wording is the main problem | held-out description candidate |
| PORT | adapt a skill to another agent/host | target-host variant + gap report |
| PACKAGE | bundle a standalone artifact | .skill archive or host plugin package |
| DISTRIBUTE | craft high-presence repo & distribute | manifests (package.json, marketplace.json, .skills.json, install.sh) + GitHub repo & CI |

If several modes are requested, run them in this order:

**CREATE/IMPROVE -> PORT -> VALIDATE -> PACKAGE -> DISTRIBUTE**

## Internal skill routing

`skill-conductor` is the public orchestrator. The helper skills below do not replace its design method.

| Helper skill | Activate when | Return control when |
| --- | --- | --- |
| `skill-conductor` | full-lifecycle BinEval scoring, trigger optimization loops, or .skill packaging is needed | evaluation, optimization, or packaging is complete |
| `repo-craft-and-distribute` | scaffolding multi-agent distribution manifests, crafting high-presence GitHub repo, or fixing Mermaid diagrams | distribution manifests, CI, and repo setup are verified |
| `host-workspace-operator` | the workflow must inspect, search, patch, write, or verify repository/workspace files | the required workspace evidence or mutation is complete |
| `sandbox-python-executor` | compilation, parsing, archive inspection, hashing, or validation benefits from deterministic Python | execution evidence is captured |

Route by capability rather than by a hard-coded tool name. A host may expose equivalent read, search, patch, shell, or Python operations under different names.

Do not activate either helper for pure design reasoning when no workspace or deterministic execution is needed.

## Universal SkillSpec

Never start by free-writing `SKILL.md` for a non-trivial skill.

Create a SkillSpec first. Use `references/skill-spec.md`.

At minimum capture:

- name and purpose
- user language that should trigger
- near-miss language that should not trigger
- baseline failure evidence
- required outputs
- invariants and forbidden behavior
- workflow steps
- freedom level per step
- required tools/resources
- target hosts
- positive, negative, and pressure evals
- acceptance gates

When deterministic generation is useful, run:

```bash
python3 scripts/compile_skill_spec.py --spec <spec.json> --out <skill-dir>
```

The compiler is a scaffold, not a substitute for judgment. Review the generated instructions against the failure evidence and host contract.

## Host contract

Use `references/host-profiles.md`.

Treat host support as a capability contract, not a brand name. Record:

- discovery mechanism
- skill/package layout
- metadata/frontmatter requirements
- read/list/search/grep availability
- write/patch boundary
- shell and Python availability
- subagent support
- external network behavior
- confirmation/approval behavior
- observable trigger evidence
- packaging/install path

Known profiles in this repository:

- Agent Skills baseline
- ChatGPT
- Codex
- Claude Code
- Custom/unknown host

When the host is unknown, use the baseline format and produce a gap list. Do not fabricate host-specific manifest fields or tool names.

## CREATE

### 1. Prove the baseline failure

Use at least one realistic scenario without the skill.

Record what failed:

- discovery
- missing domain knowledge
- wrong sequence
- skipped verification
- inconsistent formatting
- unsafe or over-broad action
- tool misuse
- unnecessary context/time

If the agent already succeeds reliably, do not add a skill merely to create one.

### 2. Write the SkillSpec

Use realistic user language, not taxonomy labels.

Require at least:

- 3 positive trigger examples
- 2 near-miss negatives
- 1 pressure/adversarial case when the skill enforces discipline
- concrete expected outputs
- explicit stop/fallback behavior

### 3. Choose architecture and freedom

Read `references/patterns.md`.

Select the primary pattern:

| Pattern | Use when |
| --- | --- |
| Sequential | ordering is the main source of reliability |
| Iterative refinement | output improves through bounded cycles |
| Context-aware selection | the same job needs different paths by context |
| Domain intelligence | specialized knowledge is the missing capability |
| Multi-tool coordination | the job spans multiple services/capability families |

Set freedom per step, not once for the whole skill:

- **low**: exact operation, high consequence, deterministic implementation preferred
- **medium**: preferred method with bounded judgment
- **high**: many valid approaches, low consequence of variation

Ask: **what happens if the agent improvises here?** The larger the consequence, the lower the freedom.

### 4. Author with progressive disclosure

Read `references/sop-practices.md`.

Keep:

- frontmatter focused on discovery, not the workflow
- `SKILL.md` as the routing map and core method
- detailed knowledge in `references/`
- fragile repeatable operations in `scripts/`
- output templates and non-instruction assets in `assets/`

Use one term per concept. Explain why high-risk rules exist. Put checks at the point of failure, not only at the end.

Do not copy host-specific paths, CLI names, or approval assumptions into universal instructions unless the SkillSpec explicitly targets that host.

### 5. Build evals before polishing

Create eval families:

1. direct intended prompts
2. indirect intended prompts
3. near-miss negatives
4. behavior assertions
5. pressure cases when applicable
6. cross-host cases for every claimed target

The skill is not done because the prose looks complete.

### 6. Implement and run the gate

Use the current host's actual capabilities.

For static compilation:

```bash
python3 scripts/compile_skill_spec.py --spec <spec.json> --out <output-dir>
```

For structural and portability checks:

```bash
python3 scripts/validate_portability.py <skill-dir> --targets <comma-separated-hosts>
```

For provider-specific dynamic runners, follow `references/runtime-setup.md` and label their evidence by host.

### 7. Refactor after evidence

Only change instructions in response to a demonstrated failure or an identified host gap.

Prefer the smallest change that fixes the failure. Re-run the relevant positive, negative, held-out, and pressure cases.

## IMPROVE

### 1. Diagnose the failure class

Read the entire existing skill and map failures to one or more classes:

| Failure | Typical signal |
| --- | --- |
| Undertriggering | intended query never loads the skill |
| Overtriggering | adjacent tasks load the skill |
| Body bypass | model acts from metadata and skips instructions |
| Knowledge gap | instructions do not contain the missing expertise |
| Sequence gap | agent knows the pieces but performs them in the wrong order |
| Freedom mismatch | fragile step is left open-ended |
| Tool mismatch | instructions assume unavailable host capabilities |
| Packaging mismatch | skill is valid but host cannot discover/install it |
| Context bloat | useful behavior is buried in excessive loaded text |

Do not rewrite the whole skill before knowing which class failed.

### 2. Reconstruct the SkillSpec

If the skill has no SkillSpec, infer one from the artifact and observed behavior. Mark inferred fields as such.

Separate:

- intended behavior
- current implementation
- observed failures
- host-specific assumptions

### 3. Freeze the eval split

Keep the existing evidence discipline:

1. stratify train vs held-out once per session
2. do not expose held-out lessons to the editor
3. learn from train failures
4. apply at most 3 atomic edits per iteration
5. run all cases again

Accept a candidate only if:

- train performance improves on the targeted failure
- no new critical question fails
- a held-out pass->fail flip does not reproduce in two consecutive runs

Keep the best accepted candidate, not the latest candidate.

### 4. Preserve host boundaries

A fix learned on one host is a hypothesis for another host, not proof.

When a change touches discovery, tool use, filesystem operations, shell/Python, approvals, or packaging, re-run the affected target-host cases.

## VALIDATE

Run four layers in order. Use `references/cross-host-evaluation.md`.

### Layer 1: Artifact

Check:

- exact `SKILL.md`
- valid frontmatter
- folder/name agreement
- description size and discovery focus
- reference depth
- no secret-shaped content
- no personal absolute paths
- declared resource paths exist
- package manifest paths stay inside package root

Use:

```bash
python3 scripts/validate_portability.py <skill-dir> --targets <hosts>
```

### Layer 2: Discovery

For each target host, test:

- 3 direct positives
- 3 indirect positives
- 3 near-miss negatives

Use a clean context when the host supports it.

Do not reuse one host's trigger result as another host's evidence.

`run_eval.py` is currently a **Claude Code discovery adapter**. It creates Claude command files and invokes `claude -p`; it is not a ChatGPT/Codex trigger oracle.

### Layer 3: Behavior

Grade observable assertions, not writing style.

Use `agents/grader.md` for task-output assertions and `agents/bineval.md` for artifact questions.

The judge writes critique/evidence before verdict. The orchestrator computes the aggregate and gate.

### Layer 4: Portability

For every target host, answer:

- does discovery work there?
- are required capabilities present?
- are mutation/approval assumptions correct?
- do resource paths resolve after install?
- can deterministic scripts run in the exposed runtime?
- does the package format match the host?
- which claims remain unverified?

A multi-host skill passes only for the hosts with complete evidence. Report partial support explicitly.

## REVIEW

Use for third-party skills before installation or reuse.

Check:

- discovery scope and negative triggers
- workflow usefulness versus generic advice
- progressive disclosure
- hidden tool/network assumptions
- script and reference safety
- secret-shaped or user-specific data
- package traversal/symlink risk when inspecting an archive
- host compatibility claims
- eval quality
- time-sensitive instructions that can rot

Then classify:

- **installable**: no critical issue and claims match evidence
- **repairable**: useful core but blocking issues exist
- **reject**: unsafe, misleading, or behavior adds no meaningful value

Do not treat repository popularity as skill quality evidence.

## OPTIMIZE

Use only when discovery wording is the main failure.

1. Build a realistic prompt bank with positive and near-miss cases
2. Freeze train/held-out split
3. Change description only from train evidence
4. Compare candidates on held-out discovery
5. re-run direct/indirect/negative prompts on the target host

Current `run_loop.py` and `improve_description.py` are Claude-oriented adapters. Use them only for Claude Code evidence unless they are explicitly refactored behind another host adapter.

For ChatGPT, Codex, or custom hosts, use the actual host's discovery mechanism rather than simulating a Claude event stream.

## PORT

Port behavior, not branding.

### 1. Extract the universal core

From the source skill, capture:

- job and failure
- triggers/negatives
- workflow and invariants
- knowledge/resources
- deterministic scripts
- eval assertions

### 2. Strip source-host mechanics

Mark every assumption about:

- tool names
- skill-loading events
- directories
- env variables
- CLI commands
- subagents
- permissions/approvals
- app/MCP bindings

Do not search-and-replace provider names.

### 3. Apply target host profile

Use `references/host-profiles.md` to map each required capability.

Disposition each source behavior:

- preserve
- translate
- replace
- make optional
- remove
- unresolved gap

### 4. Recompile and re-evaluate

Generate the target-host artifact, then run all four VALIDATE layers.

Return a port report with:

- preserved universal behavior
- target-specific adaptations
- unsupported assumptions
- tests actually run
- tests not run
- confidence by host

## PACKAGE

Choose the package from the target host.

### Standalone Agent Skill

For Agent Skills-compatible hosts, package the skill folder only after validation.

Existing `package_skill.py` can create the `.skill` archive. Inspect the extracted archive before claiming success.

### ChatGPT/Codex Plugin

When the user asks for a Plugin, follow the current OpenAI Plugin contract rather than copying Claude metadata.

Expected root shape:

```text
.codex-plugin/
  plugin.json
skills/
  <skill>/SKILL.md
assets/                  # optional
```

Keep only `plugin.json` in `.codex-plugin/`. A skills-only Plugin does not need MCP merely to execute instructions or use host-native file/Python capabilities.

Validate package-relative paths and final listing metadata against current OpenAI documentation before submission.

### Claude Code plugin

Preserve `.claude-plugin/` metadata and Claude-specific runner behavior only for the Claude distribution path.

### Custom host

Use its documented package contract. If documentation or install evidence is unavailable, deliver the portable Skill plus a gap report instead of inventing a package.

## Quality gate

Use BinEval across:

- Discovery
- Clarity
- Structure
- Robustness
- Completeness

The judge answers atomic questions with evidence. The orchestrator computes scores.

A scalar does not override a critical failure.

For multi-host claims, add the portability gate from `references/cross-host-evaluation.md`.

## Evidence rules

- Never say a command ran if the current host did not execute it
- Never claim trigger behavior on a host that was not tested
- Never infer a public publisher identity from a repository owner
- Never hide missing legal URLs or reviewer requirements behind draft copy
- Never add MCP or authentication just to make a Plugin look more substantial
- Never let a provider-specific runner define universal Skill quality

## Stop conditions

Stop an improvement loop when any applies:

- target failure is fixed and gates pass
- 3 accepted/rejected edit iterations produce no reproducible improvement
- missing host capability prevents further evidence
- evals are too weak to discriminate candidates
- user intent changed enough to require a new SkillSpec

Report the blocker and preserve the best accepted version.

## Reference map

Load on demand:

| Path | Use |
| --- | --- |
| `references/skill-spec.md` | universal design contract |
| `references/host-profiles.md` | host capability mapping |
| `references/cross-host-evaluation.md` | per-host evidence and portability gate |
| `references/patterns.md` | architecture patterns |
| `references/sop-practices.md` | authoring canon and procedural skills |
| `references/pressure-testing.md` | micro-tests and discipline pressure cases |
| `references/bineval-method.md` | binary evaluation and acceptance gate |
| `references/quality-questions.md` | fixed artifact question bank |
| `references/schemas.md` | eval/benchmark JSON shapes |
| `references/runtime-setup.md` | execution capabilities and provider-specific adapters |
| `agents/grader.md` | assertion grading |
| `agents/comparator.md` | blind A/B output comparison |
| `agents/analyzer.md` | root-cause analysis |
| `agents/bineval.md` | artifact binary judging |
| `scripts/compile_skill_spec.py` | portable SkillSpec compiler |
| `scripts/validate_portability.py` | static host/package validation |
| `scripts/test_portability.py` | portable smoke tests |
| `scripts/run_eval.py` | Claude Code trigger adapter |
