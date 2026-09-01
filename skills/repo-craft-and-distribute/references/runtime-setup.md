# Runtime Setup & Tool Dependencies

Before running repo crafting and distribution tasks, ensure required CLI tooling is installed and authenticated.

## Pre-flight Checklist

```bash
# 1. Verify Git and GitHub CLI
git --version
gh --version
gh auth status

# 2. Verify Bun Runtime (Mandatory per AGENTS.md constitution)
bun --version

# 3. Verify Python 3 (for skill evaluation & packaging)
python3 --version
```

## Tool Setup

- **GitHub CLI (`gh`)**: Required for creating repos, configuring metadata, adding discovery topics, and managing releases.
  ```bash
  brew install gh
  gh auth login
  ```
- **Bun**: Required for fast script execution, lockfiles, and zero-install execution.
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
- **Skill Evaluator (`eval_skill.py`)**: Located at `~/.gemini/config/skills/skill-conductor/scripts/eval_skill.py`.
