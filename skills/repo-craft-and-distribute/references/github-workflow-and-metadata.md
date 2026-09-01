# GitHub Workflow, Discovery Metadata & CI

Automate repository setup, discovery tags, and quality gates using the GitHub CLI (`gh`).

---

## 1. Automated Repository Creation & Push

```bash
# 1. Initialize git and switch to standard main branch
git init
git branch -M main
git add .
git commit -m "feat: initial release of <skill-name> universal agent skill"

# 2. Create public GitHub repository and push
gh repo create <username>/<repo-name> --public --source=. --push \
  --description "<Detailed pitch under 120 chars>"

# 3. Configure metadata, discovery topics, and homepage
gh repo edit <username>/<repo-name> \
  --add-topic "agent-skill,skills-sh,claude-code,bun,typescript,cursor,codex,gemini-cli" \
  --homepage "https://skills.sh/<skill-name>" \
  --enable-issues
```

---

## 2. GitHub Actions CI Pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Verify CLI Execution
        run: |
          bun ./bin/cli.js --help

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Validate SKILL.md Frontmatter
        run: |
          python3 -c "
          content = open('SKILL.md').read()
          assert content.startswith('---'), 'Missing YAML frontmatter'
          assert 'name:' in content, 'Missing name in frontmatter'
          assert 'description:' in content, 'Missing description in frontmatter'
          print('✅ SKILL.md validation passed!')
          "
```

---

## 3. Community Health Files Checklist

Every high-presence repository must include:
- [ ] `LICENSE` (MIT Standard)
- [ ] `.gitignore` (Bun, node_modules, OS files, temp cache)
- [ ] `CONTRIBUTING.md` (Workflow & PR instructions)
- [ ] `SECURITY.md` (Vulnerability disclosure policy)
- [ ] `CODE_OF_CONDUCT.md` (Contributor covenant)
