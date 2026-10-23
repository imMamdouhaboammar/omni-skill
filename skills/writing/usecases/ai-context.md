# Drafting AI Context Documents (SKILL.md, AGENTS.md, CLAUDE.md)

Guidelines for authoring instructions intended for autonomous AI agents.

1. **Keep Under the Line Budget**: Aim for `<500 lines` in primary entry files (`SKILL.md`) to conserve context window and focus attention.
2. **Explicit Trigger Phrases**: Include positive triggers, natural language paraphrases, and close negative counter-examples in frontmatter `description`.
3. **Link to References Early**: Reference deep domain specifications in `references/` at the top of relevant sections rather than in footnotes.
4. **Define Deterministic Gates**: State concrete falsifiable exit conditions for each mode or workflow.
5. **Prohibit Speculative Actions**: State what the agent must NOT touch or mutate.
