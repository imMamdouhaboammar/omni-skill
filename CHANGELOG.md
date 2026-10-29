# Changelog

## Plugin 6.1.1

- Add portable OpenAI plugin metadata, guided setup, focused skill interfaces,
  and an explicit skills-only public package boundary.
- Route from security, failure, and verification state before release intent;
  distinguish ChatGPT and Codex and fix substring routing collisions.
- Defer detailed lifecycle recipes instead of eagerly loading them.
- Build deterministic, security-gated upload ZIPs with archive regression tests.
- Require one explicit new installer destination and preserve existing installs.
- Document host smoke cases and remaining portal publication facts.


All notable changes to the **OmniSkill** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [6.2.0] - 2026-10-29

### Added
- **Automatic Provenance & Intellectual Property Signing**:
  - `omni-skill init` automatically stamps newly initialized skills with `author: Omni Skill`, `repository: https://github.com/imMamdouhaboammar/omni-skill`, metadata, and an `## Attribution & Provenance` section.
  - Generates signing headers across operational recipes (`usecases/run.md`) and specification schemas (`references/spec.md`).
  - TypeScript compiler (`compiler.ts`) and Python compilers (`compile_spec.py`, `compile_skill_spec.py`) inject provenance signatures and attribution sections into compiled artifacts.
  - Skill and tool scaffolders (`init_skill.py`, `scaffold-repo.ts`) stamp generated packages, scripts, and distribution manifests (`package.json`, `marketplace.json`, `.skills.json`, `install.sh`, `bin/cli.js`) with generator attribution and repository provenance.
  - Extended frontmatter schemas, parser, and type interfaces (`SkillFrontmatter`, `OmniSkillSpec`) to natively support `author`, `repository`, and `metadata`.
  - Added strict attribution invariants to `SKILL.md` authoring standards across `omni-skill`, `skill-conductor`, and `skill-authoring`.

## [6.1.0] - 2026-10-26

### Added
- **Evidence-Derived Evaluation Harness (`omni-skill eval`)**:
  - Implemented real case execution against candidate evidence via `-c, --candidate` and `-r, --responses` flags (#1).
  - Added `-j, --json` flag for machine-readable evaluation outputs and CI pipelines.
  - Fail-closed evaluation: unverified cases without candidate responses return exit code 1 instead of false positive 100% passes.
  - Added response fixture in `examples/sql-optimizer/evals/responses.json`.
- **YAML-Safe Frontmatter Serialization**:
  - Replaced raw string interpolation with YAML-safe stringification in TypeScript compiler and Python spec compiler (#9).
  - Handles colons, hashes, single/double quotes, multiline block scalars, and Unicode correctly without malforming YAML frontmatter.
  - Standard-library fallback parsing in `portability_validator.py` and `validate_portability.py` supporting quoted strings and block scalars without hard PyYAML dependency.

### Fixed
- **Accessibility Landmarks & Compliance (WCAG 2.1 AA / Insight Code)**:
  - Added `<main>` landmark regions to `public/index.html` (#88).
  - Added `<main>` landmark regions and `scope="col"` attributes to evaluation review templates in `skills/omni-skill/assets/eval_review.html` and `skills/skill-conductor/assets/eval_review.html` (#90, #93).
  - Added `@media (prefers-reduced-motion: reduce)` queries for `.skill-card` and toggle switches while preserving checked knob positions (#89, #93).
  - Added Playwright browser test coverage in `skills/omni-skill/scripts/test_viewer_accessibility.py` verifying landmarks, scopes, and reduced-motion rules.

## [6.0.1] - 2026-10-25

### Fixed
- Hardened packaging security preflight and artifact integrity checks (#2).
- Validated compiler path containment and reference containment against traversal attacks (#7, #8).
- Hardened static validator fail-closed boundary enforcement on unreadable system edge cases (#3).

## [6.0.0] - 2026-10-25

### Added
- Initial release of OmniSkill v6: Universal Cross-Host Agent Skill Engine & Compiler.
- 15 production sub-skills across engineering discipline and autonomous toolchain suites.
- 7-pass static analysis engine and dynamic agentic router.
