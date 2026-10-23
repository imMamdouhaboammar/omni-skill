# Create a Skill: End-to-End Scaffolding

Operational workflow for authoring a new AgentSkills package.

1. **Scaffold with CLI**:
   ```bash
   omni-skill init <skill-name> -d "<description>"
   ```
2. **Draft Rationale & Target State**:
   Write the `## Why This Skill Is Needed & Target State` section. Describe the root cause mechanism that causes agents to fail without this skill, and describe the ideal outcome.
3. **Draft Invariant Rules**:
   Formulate 3-5 core constraints. Each rule must have an imperative directive and a single-line reason explaining the failure mode it prevents.
4. **Extract Procedural Workflows to `usecases/`**:
   Write operational recipes in `usecases/<verb>.md`. Use active imperative verbs (e.g., `measure.md`, `integrate.md`, `setup.md`).
5. **Extract Deep Domain Context to `references/`**:
   Place schemas, API specs, error codes, and reference guides in `references/<name>.md`. Link them in `SKILL.md`.
6. **Validate Package**:
   ```bash
   omni-skill validate skills/<skill-name>
   ```
   Ensure 0 errors and 0 warnings before release.
