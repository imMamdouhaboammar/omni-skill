# Cross-host evaluation

A skill is not portable because the same files can be copied to several products.

Portability is an evidence claim. Evaluate four layers separately for each target host.

## Layer 1: Artifact

Question: is the Skill structurally valid before a model sees it?

Check:

- `SKILL.md` exists with valid frontmatter
- name and folder agree
- description is within host limits and focuses on discovery
- referenced files exist
- package paths stay inside the package
- no secret-shaped values or personal absolute paths
- scripts and assets are in the expected locations

Artifact validation is portable evidence. It does not prove discovery or behavior.

## Layer 2: Discovery

Question: does the target host invoke the Skill for the right user language?

Create prompt families:

### Direct positives

Users explicitly name the job or the Skill.

### Indirect positives

Users describe the failure/outcome without the canonical Skill term.

### Near-miss negatives

Prompts share vocabulary but should be handled without the Skill.

Recommended minimum per host:

- 3 direct positives
- 3 indirect positives
- 3 near-miss negatives

Record repeated-run variance when the host permits clean repeated runs.

A discovery result belongs to one host and one tested configuration. Do not transfer it to another host.

## Layer 3: Behavior

Question: after discovery, does the Skill change behavior in the intended way?

Grade atomic observable assertions.

Example:

```json
{
  "assertion": "The release verdict identifies package-boundary validation",
  "passed": true,
  "evidence": "The output includes the package contents check and its result"
}
```

Prefer assertions derived from the baseline failure, required outputs, and invariants.

Do not grade vague qualities such as `professional` unless the SkillSpec turns them into observable criteria.

For major variants, compare source vs candidate blind when practical.

## Layer 4: Portability

Question: do host-specific assumptions hold?

Check every capability the workflow relies on:

- discovery mechanism
- filesystem/resource access
- search/grep semantics
- write/patch behavior
- shell/Python availability
- network behavior
- subagent/parallel execution
- approvals and confirmations
- install/package layout

Classify each as:

- verified
- unsupported
- unknown
- not required

Unknown is not a failure if the host was unavailable, but it blocks a claim that the Skill was verified on that host.

## Evidence record

Use a host-labeled result:

```json
{
  "host": "codex",
  "artifact": "pass",
  "discovery": {
    "positive_passed": 6,
    "positive_total": 6,
    "negative_passed": 3,
    "negative_total": 3
  },
  "behavior": {
    "critical_pass": true,
    "assertions_passed": 8,
    "assertions_total": 9
  },
  "portability": {
    "read": "verified",
    "patch": "verified",
    "python": "verified",
    "network": "not required"
  },
  "unverified": []
}
```

Never synthesize numbers that were not produced by a real run.

## Acceptance gate

For each claimed target host, require:

1. artifact checks have no blocking errors
2. all critical discovery positives and near-miss negatives pass
3. all critical behavior assertions pass
4. required capabilities are verified or have a tested fallback
5. package/install evidence exists when distribution is part of the claim

Non-critical improvements should reproduce before they drive another edit.

For a multi-host release, report a matrix instead of a single `portable: true` flag.

| Host | Artifact | Discovery | Behavior | Portability | Install | Status |
| --- | --- | --- | --- | --- | --- | --- |
| ChatGPT | pass | pass | pass | pass | pass | verified |
| Codex | pass | pass | pass | pass | pass | verified |
| Claude Code | pass | pass | pass | gap | pass | partial |

## Judge discipline

Keep existing Conductor judge rules:

- critique/evidence before verdict
- threshold-blind judging
- cross-family calibration when available
- held-out cases hidden from the editor
- external gates for self-correction

A second model family can calibrate judgment questions. It cannot substitute for running the target host's discovery or capability checks.
