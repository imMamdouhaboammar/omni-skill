# High-Presence README Standards & Mermaid Safety

Crafting an open-source repository with high presence and aesthetic authority requires strict attention to visual hierarchy, badge design, and diagram syntax.

---

## 1. Aesthetic Badge Header

Always center the header and use Flat-Square badges from Shields.io:

```markdown
<div align="center">

# 📦 [Project Name]

### [Short One-Line Pitch / Value Proposition]
**[Key Feature 1] • [Key Feature 2] • [Key Feature 3]**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Bun](https://img.shields.io/badge/Runtime-Bun%20%3E%3D1.0-FBF0DF?style=flat-square&logo=bun&logoColor=black)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Skills.sh](https://img.shields.io/badge/Skills.sh-Compatible-000000?style=flat-square&logo=vercel&logoColor=white)](https://skills.sh)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Certified%20Skill-D97706?style=flat-square&logo=anthropic&logoColor=white)](https://claude.ai)
[![Skill Conductor](https://img.shields.io/badge/Skill%20Conductor-10%2F10%20Verified-10B981?style=flat-square)](SKILL.md)

<p align="center">
  <a href="#-key-features">Features</a> •
  <a href="#-quickstart">Quickstart</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-cli-reference">CLI Reference</a> •
  <a href="#-troubleshooting">Troubleshooting</a>
</p>

</div>
```

---

## 2. Strict GitHub Mermaid Diagram Rules

GitHub's Markdown renderer throws `Unable to render rich display` if Mermaid syntax is unquoted.

### Mandatory Rules:
1. **Always quote all node labels**:
   ```mermaid
   flowchart TD
       A["Agent Command"] --> B["CLI Engine"]
       B --> C["External API / Browser"]
   ```
2. **Always quote all edge labels**:
   ```mermaid
   flowchart TD
       A -->|"Flag: --submit"| B["Publish Step"]
       A -->|"Flag: --preview"| C["Dry-Run Step"]
   ```
3. **Use alphanumeric subgraph IDs with quoted display titles**:
   ```mermaid
   subgraph MediaPipeline ["Media & Clipboard Pipeline"]
       G["Local Asset"] --> H["Clipboard Helper"]
   end
   ```
4. **Never leave unquoted punctuation** (`--`, `/`, `&`, `+`, `~`, `.`, `=`) inside raw labels.

---

## 3. Structural Sections of High-Presence Repositories

1. **Header & Badges**: Centered hero block.
2. **Executive Overview**: 2-3 sentences explaining why it exists and what problem it solves.
3. **Feature Matrix Table**: Comparative table mapping capabilities to benefits.
4. **Quickstart (Zero-Install first)**: `npx` / `bunx` commands followed by agent skill clone.
5. **Architecture Diagram (Mermaid)**: Visual diagram of execution flow.
6. **CLI Reference Table**: Comprehensive table of flags, types, defaults, descriptions.
7. **Environment Variables**: Table of all supported env knobs.
8. **Troubleshooting & FAQ**: Root causes and fixes for top 3 failure modes.
9. **Contributing & License**: Links to `CONTRIBUTING.md` and `LICENSE`.
