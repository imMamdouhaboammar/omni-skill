# OmniSkill Agent Adapters Guide

OmniSkill includes built-in compiler targets for every major AI coding agent and LLM runtime.

## Supported Targets

### 1. OpenAI ChatGPT & Codex (`--target chatgpt` or `codex`)
Generates `.codex-plugin/plugin.json` exposing skills-only architecture without requiring hosted MCP dependencies.

### 2. Claude Code (`--target claude` or `claude-code`)
Generates `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` compatible with Claude Code Plugin packaging.

### 3. Google Antigravity & Gemini CLI (`--target antigravity` or `gemini`)
Generates `.gemini/plugin.json` configuring native auto-injection, lifecycle hooks, and system prompts.

### 4. Cursor IDE (`--target cursor`)
Generates `.cursorrules` containing high-density behavioral directives, constraints, and decision trees.

### 5. Codeium Windsurf (`--target windsurf`)
Generates `.windsurfrules` containing project memory and behavioral instructions.

### 6. Cline & Roo Code (`--target cline` or `roo`)
Generates `.clinerules` formatted for Cline/Roo execution environments.

### 7. GitHub Copilot Workspace (`--target copilot`)
Generates `.github/copilot-instructions.md` targeting Copilot's repository indexer.

### 8. OpenCode & DeepSeek Harness (`--target opencode`)
Generates `.opencode/skill.json` for custom LLM provider harnesses.

---

## Example: Porting a Skill

```bash
# Port our SQL optimizer to Cursor
omni-skill port examples/sql-optimizer --target cursor

# Port our SQL optimizer to ChatGPT / Codex
omni-skill port examples/sql-optimizer --target chatgpt

# Port our SQL optimizer to Claude Code
omni-skill port examples/sql-optimizer --target claude
```
