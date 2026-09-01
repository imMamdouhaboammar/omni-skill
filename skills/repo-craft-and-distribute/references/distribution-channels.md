# Ecosystem Distribution Channels Guide

Comprehensive guide for registering and distributing agent skills across modern AI ecosystems.

---

## 1. Claude Code & Claude Desktop
- **User Location**: `~/.claude/skills/<skill-name>`
- **Project Location**: `.claude/skills/<skill-name>`
- **Package Archive**: Single `.skill` zip package extracted into the skills folder.
- **Claude Marketplace**: Plugin system via `marketplace.json` manifest.

---

## 2. Skills.sh (Vercel Ecosystem)
- **Hub**: [Skills.sh](https://skills.sh)
- **Manifest**: `.skills.json` at repo root.
- **Installation CLI**:
  ```bash
  npx skills add https://github.com/<owner>/<repo>
  npx skills add <skill-name>
  ```

---

## 3. npm / npx Instant Zero-Install
- **Manifest**: `package.json` with `"bin": { "<skill-name>": "./bin/cli.js" }`
- **Execution**:
  ```bash
  npx <skill-name> [command] [options]
  bunx <skill-name> [command] [options]
  ```

---

## 4. Cursor, Codex, OpenCode & Windsurf
- **Cursor**: `.cursor/skills/<skill-name>` or rules in `.cursor/rules/<skill-name>.mdc`
- **Codex / OpenCode**: `~/.codex/skills/<skill-name>` or `.agents/skills/<skill-name>`
- **Windsurf**: `.windsurf/skills/<skill-name>` or `.windsurfrules`
- **Roo Code / Cline**: Custom subagent instructions referencing `SKILL.md`

---

## 5. Antigravity & Gemini CLI
- **Location**: `~/.gemini/config/skills/<skill-name>` or `.agents/skills/<skill-name>`
- **Validation**: Evaluated directly via `eval_skill.py`.
