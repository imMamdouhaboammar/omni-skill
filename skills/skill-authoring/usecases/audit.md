# Audit a Skill: Quality Verification Gate

Procedure for auditing third-party or newly authored skill packages before deployment.

1. **Run Static Validator**:
   ```bash
   omni-skill validate <skill-dir>
   ```
2. **Audit Relative Links**:
   Ensure all markdown links (`[text](references/...)` and `[text](usecases/...)`) resolve to actual files on disk.
3. **Audit Line Budget**:
   Verify that `SKILL.md` is strictly under 500 lines. If larger, move background explanations into `references/`.
4. **Audit Anti-Slop Discipline**:
   Check for forbidden conversational filler, internal developer notes ("TODO:", "Mock data"), and patronizing syntax narration.
5. **Verify Delegation Targets**:
   Ensure all named companion skills exist in the registry or workspace.
