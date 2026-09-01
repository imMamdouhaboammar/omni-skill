# Repo Crafting & Universal Multi-Agent Distribution

Automated standard for turning a verified agent skill into a high-presence open-source repository distributed across the entire AI ecosystem (Claude Code, Claude Marketplace, Skills.sh, npm/npx, Bun, Cursor, Codex, OpenCode, Antigravity, Gemini CLI).

---

## 1. Automated Scaffolding (One Command)

To instantly scaffold all distribution manifests, CI workflows, and universal installers for any repository:

```bash
bun scripts/scaffold-repo.ts <skill-path> \
  --name "<skill-name>" \
  --author "<Author Name>" \
  --desc "<Short Pitch>"
```

---

## 2. Multi-Agent Manifests Checklist

| Manifest | Purpose & Ecosystem Target | Key Attributes |
|---|---|---|
| `package.json` | npm / Bun / npx zero-install CLI runner | `"bin": { "<name>": "./bin/cli.js" }`, `"type": "module"` |
| `marketplace.json` | Claude Code & Claude Desktop Marketplace | `$schema` for Claude Plugin, capabilities, compatibility |
| `.skills.json` | Skills.sh (Vercel Agent Registry) | `$schema`, repository, skill entrypoint, tags |
| `install.sh` | Universal multi-agent installer | Links skill to `~/.claude/skills`, `~/.gemini/config/skills`, `~/.codex/skills`, `~/.agents/skills` |

---

## 3. High-Presence README & Strict Mermaid Rules

GitHub's Markdown renderer requires strict quoting of Mermaid diagrams to prevent `Unable to render rich display` errors:
1. **Always quote all node labels**: `A["Agent Command"] --> B["CLI Engine"]`
2. **Always quote edge texts**: `C -->|"Flag: --submit"| D["Publish Action"]`
3. **Use alphanumeric subgraph IDs with quoted titles**: `subgraph MediaPipeline ["Media & Clipboard Pipeline"]`
4. **Never leave unquoted punctuation** (`--`, `/`, `&`, `+`, `~`, `.`, `=`) inside raw labels.

---

## 4. GitHub CLI (`gh`) Automation & Topic Tagging

```bash
# 1. Initialize git and switch to main
git init && git branch -M main && git add . && git commit -m "feat: initial release"

# 2. Create public GitHub repo and push
gh repo create <username>/<repo-name> --public --source=. --push \
  --description "<Concise pitch under 120 characters>"

# 3. Add search discovery topics and homepage
gh repo edit <username>/<repo-name> \
  --add-topic "agent-skill,skills-sh,claude-code,bun,typescript,cursor,codex,gemini-cli" \
  --homepage "https://skills.sh/<skill-name>" \
  --enable-issues
```
