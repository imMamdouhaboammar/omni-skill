# Multi-Agent Manifests & Packaging Standards

To distribute an agent skill across the entire ecosystem, maintain four canonical manifests:

---

## 1. `package.json` (npm & Bun Zero-Install)

```json
{
  "name": "<skill-name>",
  "version": "1.0.0",
  "description": "Universal agent skill and CLI for ...",
  "type": "module",
  "main": "bin/cli.js",
  "bin": {
    "<skill-name>": "./bin/cli.js"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/<owner>/<repo>.git"
  },
  "files": [
    "bin",
    "scripts",
    "references",
    "SKILL.md",
    "marketplace.json",
    "install.sh"
  ],
  "scripts": {
    "start": "bun bin/cli.js",
    "test": "bun test"
  },
  "keywords": [
    "agent-skill",
    "skills.sh",
    "claude-code",
    "cursor",
    "codex",
    "gemini",
    "antigravity",
    "bun"
  ],
  "author": "<Author Name> <https://github.com/<owner>>",
  "license": "MIT",
  "engines": {
    "bun": ">=1.0.0",
    "node": ">=18.0.0"
  }
}
```

---

## 2. `marketplace.json` (Claude Plugin & Marketplace)

```json
{
  "$schema": "https://json.schemastore.org/claude-plugin-manifest.json",
  "name": "<skill-name>",
  "displayName": "<Display Name>",
  "version": "1.0.0",
  "description": "<Detailed Description>",
  "author": {
    "name": "<Author Name>",
    "url": "https://github.com/<owner>"
  },
  "homepage": "https://skills.sh/<skill-name>",
  "repository": {
    "type": "git",
    "url": "https://github.com/<owner>/<repo>.git"
  },
  "license": "MIT",
  "categories": [
    "automation",
    "developer-tools",
    "agent-tools"
  ],
  "compatibility": {
    "claudeCode": ">=1.0.0",
    "claudeDesktop": ">=1.0.0",
    "cursor": ">=0.40.0",
    "codex": ">=0.1.0",
    "opencode": ">=1.0.0",
    "antigravity": ">=1.0.0"
  },
  "entrypoint": "SKILL.md",
  "bin": {
    "<skill-name>": "./bin/cli.js"
  }
}
```

---

## 3. `.skills.json` (Skills.sh Hub)

```json
{
  "$schema": "https://skills.sh/schema.json",
  "name": "<skill-name>",
  "version": "1.0.0",
  "description": "<One line pitch>",
  "repository": "https://github.com/<owner>/<repo>",
  "author": "<Author Name>",
  "license": "MIT",
  "skill": "SKILL.md",
  "tags": [
    "agent-skill",
    "automation",
    "developer-tools"
  ]
}
```

---

## 4. `install.sh` (Universal Multi-Agent One-Liner)

```bash
#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_NAME="<skill-name>"

echo "📦 Installing ${TARGET_NAME} across AI agent environments..."

# Claude Code
if [ -d "$HOME/.claude" ] || command -v claude >/dev/null 2>&1; then
  mkdir -p "$HOME/.claude/skills"
  rm -rf "$HOME/.claude/skills/${TARGET_NAME}"
  cp -r "$SCRIPT_DIR" "$HOME/.claude/skills/${TARGET_NAME}"
  echo "  ✅ Installed for Claude Code -> $HOME/.claude/skills/${TARGET_NAME}"
fi

# Antigravity / Gemini CLI
if [ -d "$HOME/.gemini" ]; then
  mkdir -p "$HOME/.gemini/config/skills"
  rm -rf "$HOME/.gemini/config/skills/${TARGET_NAME}"
  cp -r "$SCRIPT_DIR" "$HOME/.gemini/config/skills/${TARGET_NAME}"
  echo "  ✅ Installed for Antigravity / Gemini CLI -> $HOME/.gemini/config/skills/${TARGET_NAME}"
fi

# Codex / OpenCode
if [ -d "$HOME/.codex" ]; then
  mkdir -p "$HOME/.codex/skills"
  rm -rf "$HOME/.codex/skills/${TARGET_NAME}"
  cp -r "$SCRIPT_DIR" "$HOME/.codex/skills/${TARGET_NAME}"
  echo "  ✅ Installed for Codex / OpenCode -> $HOME/.codex/skills/${TARGET_NAME}"
fi

# Global Agent Skills (~/.agents/skills)
mkdir -p "$HOME/.agents/skills"
rm -rf "$HOME/.agents/skills/${TARGET_NAME}"
cp -r "$SCRIPT_DIR" "$HOME/.agents/skills/${TARGET_NAME}"
echo "  ✅ Installed for Universal Agent Kernel -> $HOME/.agents/skills/${TARGET_NAME}"

echo "🎉 Installation complete!"
```
