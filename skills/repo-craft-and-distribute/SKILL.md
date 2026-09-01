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

Architectural standard and automation toolchain for crafting high-presence open-source repositories and distributing AI agent skills across the entire ecosystem.

## Runtime Requirements (Pre-flight)

Before running repo configuration or scaffolding commands, verify tooling → **`references/runtime-setup.md`**.

**Essential Checklist:**
- [ ] Git and GitHub CLI (`gh`) installed and authenticated (`gh auth status`)
- [ ] Bun runtime installed (`bun --version`)
- [ ] Python 3 installed (for skill validation and packaging)

**If any dependency is missing, stop and notify the user immediately.**

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

To instantly scaffold all distribution manifests, CI workflows, and universal installers for any repository:

```bash
bun ~/.gemini/config/skills/repo-craft-and-distribute/scripts/scaffold-repo.ts ./my-project \
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
