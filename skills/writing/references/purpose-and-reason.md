# Purpose and Reason

Every invariant rule must be accompanied by the mechanical reason that justifies it.

## Why Rules Need Reasons
AI models and human engineers generalize rules to novel, unanticipated edge cases based on the underlying *reason*, not the literal syntax. A bare prohibition ("Do not use X") invites workarounds that violate the spirit of the rule. A prohibition with an explicit reason ("Do not use X because Y causes Z") empowers callers to make the right choice in unexpected contexts.

## Template
```markdown
- **Rule statement**: Direct imperative directive.
- **Reason**: The mechanical failure mode or cost incurred when the rule is violated.
```
