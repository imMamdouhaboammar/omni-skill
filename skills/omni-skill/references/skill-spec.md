# SkillSpec

A SkillSpec is the provider-neutral contract for a skill. Write it before `SKILL.md` when the job is non-trivial.

The spec exists to keep behavior, host mechanics, and evaluation separate.

## Required shape

```json
{
  "name": "kebab-case-name",
  "purpose": "The repeatable job this skill improves",
  "baseline_failure": "What the target agent does wrong without the skill",
  "triggers": {
    "positive": ["real user phrasing", "another phrasing", "implicit phrasing"],
    "negative": ["near-miss one", "near-miss two"]
  },
  "outputs": ["observable result"],
  "invariants": ["behavior that must remain true"],
  "workflow": [
    {
      "action": "Do one meaningful step",
      "why": "Why this step matters",
      "freedom": "low"
    }
  ],
  "tools": ["read", "search", "python"],
  "resources": ["reference or template"],
  "host_targets": ["agent-skills", "chatgpt", "codex", "claude-code"],
  "evals": [
    {
      "name": "direct-positive",
      "prompt": "realistic prompt",
      "should_trigger": true,
      "expected": ["observable assertion"]
    }
  ]
}
```

Use `custom:<name>` for a host that has no profile yet.

## Design rules

### Purpose

Describe one repeatable user job. A Skill that tries to solve unrelated jobs should be split unless they share the same trigger, failure, workflow, and evidence model.

### Baseline failure

State the behavioral deficit, not a desired feature.

Weak:

`Make the agent better at releases`

Useful:

`Without guidance, the agent checks tests but skips package-boundary, changelog, and artifact-content verification before recommending release`

A precise failure tells the author where instructions should change behavior.

### Triggers

Positive triggers must be realistic user language. Include direct and indirect wording.

Negative triggers should be difficult near-misses, not unrelated tasks. A release audit Skill should distinguish `audit this release candidate` from `write release notes`, not from `tell me a joke`.

Minimum for non-trivial work:

- 3 positive phrasings
- 2 near-miss negatives

### Outputs

Define what the user should receive, not internal steps. Examples:

- verdict with blockers
- edited file plus validation evidence
- structured comparison with recommendation

### Invariants

Use invariants for behavior that must hold across paths, such as:

- never claim an unexecuted test passed
- preserve unrelated source files
- cite the exact source used for a decision

Do not turn every preference into an invariant. Excessive rules compete for attention.

### Workflow

Each step needs:

- `action`: what the agent does
- `why`: what failure the step prevents
- `freedom`: low, medium, or high

Set freedom from consequence:

- low when a mistake is costly or exact behavior is known
- medium when there is a preferred approach with bounded judgment
- high when several approaches are acceptable

### Tools

Name capabilities, not provider-specific tool identifiers, in the universal spec.

Prefer:

- `read`
- `list`
- `search`
- `grep`
- `patch`
- `write`
- `shell`
- `python`
- `web`
- `app:<capability>`

The host profile later maps those capabilities to actual tools or reports a gap.

### Resources

List only resources that change execution:

- reference documents
- schemas
- deterministic scripts
- output templates
- static assets

Do not add a resource to make the Skill look complete.

### Host targets

Use one or more:

- `agent-skills`
- `chatgpt`
- `codex`
- `claude-code`
- `custom:<name>`

`agent-skills` means the portable baseline only. It does not prove a specific product can discover, execute, or package the Skill.

### Evals

A complete eval set should distinguish:

1. discovery positives
2. indirect positives
3. near-miss negatives
4. behavior assertions
5. pressure cases for discipline rules
6. target-host cases for every portability claim

Do not build the eval bank from the final wording only. Preserve the original job and failure so edits cannot game the tests.

## Completeness gate

Do not compile a non-trivial SkillSpec until all are true:

- purpose is one repeatable job
- baseline failure is observable
- positive triggers contain at least 3 realistic phrasings
- negative triggers contain at least 2 near-misses
- outputs are observable
- every workflow step has action, why, and freedom
- target host is named or explicitly unknown
- evals contain positive and negative coverage

Unknown details should remain marked unknown. Never replace a missing host contract or baseline result with a confident guess.
