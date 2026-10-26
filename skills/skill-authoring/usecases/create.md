# Create a skill

Use the accepted skill contract from `skill-architect`. Create files only in the
user-authorized output scope; do not install globally as part of authoring.

1. **Create the entry point with available host tools.** Make `<skill-name>/SKILL.md`
   using native directory/write capabilities. Include valid YAML `name` and
   `description`, then the job, failure being addressed, decision rules, workflow,
   evidence requirements, and completion/fallback behavior. Create supporting
   directories only when their contents are needed.
2. **Use deterministic scaffolding when helpful.** If Python is available and a
   valid SkillSpec already exists, resolve the bundled helper from the installed
   sibling `omni-skill` directory:
   `python3 ../omni-skill/scripts/compile_skill_spec.py --spec <spec.json> --out <skill-dir>`.
   This path assumes the `skill-authoring` directory as the working directory.
   Review generated instructions against the contract.
3. **Treat the CLI as optional.** If already available, `omni-skill init` can
   scaffold the same artifact. Inspect `omni-skill init --help` before choosing
   arguments. Do not require or install the CLI merely to create a skill.
4. **Separate content by use.** Keep invariants and routing in `SKILL.md`, procedural
   detail in `usecases/`, deep knowledge in `references/`, and repeatable mechanics
   in reviewed scripts. Link only to resources that actually exist.
5. **Author evaluation cases.** Include realistic positives, near misses, a failure
   path, and pressure cases when needed. Preserve the distinction between cases
   proposed and runs observed.
6. **Verify with the available runtime.** With Python, run the sibling
   `../omni-skill/scripts/scan_skill_security.py <skill-dir>` and
   `../omni-skill/scripts/validate_portability.py <skill-dir> --targets agent-skills,chatgpt,codex`.
   Prefix both with `python3`. An existing CLI's `omni-skill validate <skill-dir>`
   is another static check, not a requirement or proof of native host behavior.
   Resolve critical findings, record warnings, and inspect the written files.
7. **Report evidence and limits.** Without executable tools, complete the supported
   authoring/static review and mark automated checks `NOT RUN`. Without file
   mutation, supply exact proposed file contents and do not say they were saved.
   Discovery and behavior need tests in each target host before tested support.
