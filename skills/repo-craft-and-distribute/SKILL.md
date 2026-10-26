---
name: repo-craft-and-distribute
description: >
  Craft high-presence open-source repositories and configure universal multi-agent
  distribution manifests, GitHub discovery metadata, and automated installers.
  Use when the user asks to prepare a repository for publishing, configure skill
  distribution for Claude Code, Skills.sh, npm, or Cursor, generate aesthetic
  README diagrams and badges, or set up multi-agent installers — even if they
  don't explicitly say "distribute skill" or "repo crafter". Do NOT use for
  general git branching, conflict resolution, or writing code implementation.
---

# Repo Craft & Universal Distribution

> Architectural standard and automation toolchain for crafting high-presence open-source repositories and distributing AI agent skills across the entire ecosystem.

## Why This Skill Is Needed & Target State

**Why this skill is needed:** Developers authoring skills and agent tools often struggle to distribute them cleanly across diverging registry standards (Vercel Skills CLI, Claude Code marketplace, npm, GitHub Actions). Manual manifest creation results in broken URLs, missing license headers, syntax errors in plugin descriptors, and poor repository discoverability.

**Target state:** Every project repository is packaged with automated, cross-host manifests (`package.json`, `marketplace.json`, `.skills.json`, `install.sh`) and CI pipelines with zero manual scaffolding errors.

## Runtime Requirements (Pre-flight)

Before running repo configuration or scaffolding commands, verify tooling → **`references/runtime-setup.md`**.

Check only dependencies needed by the selected distribution channel. Use an
available GitHub connector or authenticated CLI for repository operations; use
the project's existing package manager for builds. Python is needed only for
Python helpers. If a dependency is missing, continue independent work and mark
the affected action unavailable. Do not install tools or require all runtimes
merely to draft metadata. Verify current official package formats before writing
manifests. Publishing requires the user's authorization for that destination.

---

## Capabilities & Navigation Map

| Domain | Resource / Script | Reference Guide |
|---|---|---|
| **README & Visual Presence** | Badges, hero headers & Mermaid escaping | `references/readme-standards.md` |
| **Multi-Agent Manifests** | `package.json`, `marketplace.json`, `.skills.json`, `install.sh` | `references/multi-agent-manifests.md` |
| **GitHub Automation & CI** | `gh repo create`, topic tagging, Actions CI | `references/github-workflow-and-metadata.md` |
| **Ecosystem Channels** | Claude, Skills.sh, npm/npx, Cursor, Codex, OpenCode | `references/distribution-channels.md` |
| **Instant Scaffolding** | `scripts/scaffold-repo.ts` | Automated file generator |

---

## 1. Automated Scaffolding (One Command)

Resolve this installed skill directory to an absolute path and assign it to
`OMNI_SKILL_DISTRIBUTION_DIR`. Inspect the script and its writes first. Keep the
shell working directory at the user project so the output path resolves there.
To scaffold the requested distribution manifests, CI workflows, and universal installers for any repository:

```bash
bun "$OMNI_SKILL_DISTRIBUTION_DIR/scripts/scaffold-repo.ts" ./my-project \
  --name "my-project" \
  --author "Mamdouh Aboammar" \
  --desc "High performance agent automation toolchain"
```

This generates:
- `package.json` with npm binary & Bun execution
- `marketplace.json` conforming to Claude Plugin schema
- `.skills.json` for Skills.sh registry
- `install.sh` executable for multi-agent environments
- `bin/cli.js` executable entrypoint
- `.github/workflows/ci.yml` GitHub Actions pipeline
- `LICENSE` (MIT) & `.gitignore`

---

## 2. High-Presence README & Mermaid Safety

Always follow visual standards and strict Mermaid escaping to prevent `Unable to render rich display` errors on GitHub:

```bash
# 1. Quoted node text: A["Agent Command"] --> B["CLI Engine"]
# 2. Quoted edge text: A -->|"Flag: --submit"| B["Action"]
# 3. Alphanumeric subgraph IDs: subgraph Pipeline ["Media & Clipboard Pipeline"]
```

- Comprehensive badge sets, matrices, and hero layouts → **`references/readme-standards.md`**

---

## 3. Multi-Agent Distribution Manifests

Ensure full compatibility across all agent environments:

- **Claude Code / Desktop**: Place `SKILL.md` in root or `.claude/skills/`
- **Claude Marketplace**: Register via `marketplace.json`
- **Skills.sh (Vercel)**: Register via `.skills.json` (`npx skills add <repo>`)
- **Instant CLI**: Expose executable in `package.json` `"bin"`
- **Universal Multi-Agent**: Provide `install.sh` to link across all installed AI harnesses

- Full manifest templates and field schemas → **`references/multi-agent-manifests.md`**

---

## 4. GitHub Presence & Discovery Automation

Automate repo creation, topics, and licensing using the GitHub CLI:

```bash
# Initialize and commit
git init && git branch -M main && git add . && git commit -m "feat: initial release"

# Create public GitHub repository and push
gh repo create <username>/<repo> --public --source=. --push --description "<Pitch under 120 chars>"

# Tag topics for discovery on GitHub search
gh repo edit <username>/<repo> \
  --add-topic "agent-skill,skills-sh,claude-code,bun,typescript,cursor,codex,gemini-cli" \
  --homepage "https://skills.sh/<repo>" \
  --enable-issues
```

- CI pipelines, PR checklists, and security policies → **`references/github-workflow-and-metadata.md`**
- Ecosystem channel mappings and installation paths → **`references/distribution-channels.md`**
