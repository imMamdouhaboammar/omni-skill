# OmniSkill Installation Guide

OmniSkill offers multiple distribution and installation methods to seamlessly integrate into any developer environment, CI/CD pipeline, and AI agent runtime.

---

## 1. 1-Click Skills.sh Install (Vercel Registry)

Install directly via the standard `skills` package manager:

```bash
npx skills add imMamdouhaboammar/omni-skill
```

Or query the live registry endpoint:
```bash
curl -s https://omni-skill.vercel.app/api/skills.json
```

---

## 2. Homebrew (macOS & Linux)

Install via our official Homebrew Tap:

```bash
# Add tap and install
brew tap imMamdouhaboammar/omni-skill https://github.com/imMamdouhaboammar/omni-skill
brew install omni-skill

# Verify installation
omni-skill --help
```

---

## 3. Universal Curl / Bash One-Liner (macOS, Linux, WSL)

Install with zero manual configuration:

```bash
curl -fsSL https://raw.githubusercontent.com/imMamdouhaboammar/omni-skill/main/install.sh | bash
```

---

## 4. Bun / npm / npx (Node.js & Bun)

Install globally or run ad-hoc:

```bash
# Run ad-hoc via Bunx
bunx @omni-skill/cli --help

# Install globally via Bun
bun add -g @omni-skill/cli

# Run ad-hoc via npx
npx @omni-skill/cli --help
```

---

## 5. Standalone Precompiled Binaries

Download self-contained single executables (no runtime required) from [GitHub Releases](https://github.com/imMamdouhaboammar/omni-skill/releases):

- **macOS Apple Silicon (M1/M2/M3/M4)**: `omni-skill-darwin-arm64`
- **macOS Intel**: `omni-skill-darwin-x64`
- **Linux x86_64**: `omni-skill-linux-x64`
- **Linux ARM64**: `omni-skill-linux-arm64`
- **Windows x64**: `omni-skill-windows-x64.exe`

Make executable:
```bash
chmod +x omni-skill-darwin-arm64
sudo mv omni-skill-darwin-arm64 /usr/local/bin/omni-skill
```

---

## 6. AI Agent Ecosystem Integration

| Host Platform | Integration Method |
|---|---|
| **ChatGPT & Codex** | Automatically recognized via `.codex-plugin/plugin.json`. |
| **Claude Code** | Load via `.claude-plugin/plugin.json` or `claude plugin add imMamdouhaboammar/omni-skill`. |
| **Google Antigravity & Gemini CLI** | Auto-injected via `.gemini/` or custom hooks. |
| **Cursor IDE** | Run `omni-skill port <skill> --target cursor` to generate `.cursorrules`. |
| **Windsurf IDE** | Run `omni-skill port <skill> --target windsurf` to generate `.windsurfrules`. |
| **Cline / Roo Code** | Run `omni-skill port <skill> --target cline` to generate `.clinerules`. |
| **GitHub Copilot** | Run `omni-skill port <skill> --target copilot` to generate `.github/copilot-instructions.md`. |
