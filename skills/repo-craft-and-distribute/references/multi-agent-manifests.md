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
# Copy to one user-selected destination; never probe or replace agent settings.
set -euo pipefail
if [ "$#" -ne 1 ]; then
  echo 'Usage: bash install.sh <new-skill-directory>' >&2
  exit 2
fi
SOURCE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
if [ -e "$1" ] || [ -L "$1" ]; then
  echo 'Destination exists; refusing to replace it.' >&2
  exit 1
fi
PARENT_DIR="$(cd -- "$(dirname -- "$1")" && pwd -P)"
DESTINATION="$PARENT_DIR/$(basename -- "$1")"
case "$DESTINATION/" in
  "$SOURCE_DIR/"*) echo 'Destination must be outside the source.' >&2; exit 1 ;;
esac
cp -R -- "$SOURCE_DIR" "$DESTINATION"
printf 'Installed at %s\n' "$DESTINATION"
```
