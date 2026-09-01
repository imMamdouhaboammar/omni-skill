import fs from 'node:fs';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

function printUsage(): never {
  console.log(`Scaffold distribution manifests, CI workflows, and installer for any AI agent skill or repository

Usage:
  bun scripts/scaffold-repo.ts <target-dir> [options]

Options:
  --name <name>         Skill/Package name (kebab-case, default: folder name)
  --author <author>     Author name (default: Git user or Mamdouh Aboammar)
  --desc <description>  Short description / pitch
  --help                Show this help message

Example:
  bun scripts/scaffold-repo.ts ./my-skill --name my-skill --author "Mamdouh Aboammar"
`);
  process.exit(0);
}

async function scaffold(targetDir: string, skillName: string, author: string, desc: string): Promise<void> {
  const absTarget = path.resolve(targetDir);
  await mkdir(absTarget, { recursive: true });
  await mkdir(path.join(absTarget, '.github', 'workflows'), { recursive: true });
  await mkdir(path.join(absTarget, 'bin'), { recursive: true });
  await mkdir(path.join(absTarget, 'references'), { recursive: true });

  console.log(`[scaffold-repo] Scaffolding distribution layer for '${skillName}' at: ${absTarget}`);

  // 1. package.json
  const packageJson = {
    name: skillName,
    version: "1.0.0",
    description: desc,
    type: "module",
    main: "bin/cli.js",
    bin: {
      [skillName]: "./bin/cli.js"
    },
    files: [
      "bin",
      "scripts",
      "references",
      "SKILL.md",
      "marketplace.json",
      "install.sh"
    ],
    scripts: {
      start: "bun bin/cli.js",
      test: "bun test"
    },
    keywords: [
      "agent-skill",
      "skills.sh",
      "claude-code",
      "cursor",
      "codex",
      "gemini",
      "antigravity",
      "bun"
    ],
    author: author,
    license: "MIT",
    engines: {
      bun: ">=1.0.0",
      node: ">=18.0.0"
    }
  };
  await writeFile(path.join(absTarget, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');

  // 2. marketplace.json
  const marketplaceJson = {
    $schema: "https://json.schemastore.org/claude-plugin-manifest.json",
    name: skillName,
    displayName: skillName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
    version: "1.0.0",
    description: desc,
    author: {
      name: author
    },
    homepage: `https://skills.sh/${skillName}`,
    license: "MIT",
    categories: ["automation", "developer-tools", "agent-tools"],
    compatibility: {
      claudeCode: ">=1.0.0",
      claudeDesktop: ">=1.0.0",
      cursor: ">=0.40.0",
      codex: ">=0.1.0",
      opencode: ">=1.0.0",
      antigravity: ">=1.0.0"
    },
    entrypoint: "SKILL.md",
    bin: {
      [skillName]: "./bin/cli.js"
    }
  };
  await writeFile(path.join(absTarget, 'marketplace.json'), JSON.stringify(marketplaceJson, null, 2) + '\n');

  // 3. .skills.json
  const skillsJson = {
    $schema: "https://skills.sh/schema.json",
    name: skillName,
    version: "1.0.0",
    description: desc,
    author: author,
    license: "MIT",
    skill: "SKILL.md",
    tags: ["agent-skill", "automation", "developer-tools"]
  };
  await writeFile(path.join(absTarget, '.skills.json'), JSON.stringify(skillsJson, null, 2) + '\n');

  // 4. install.sh
  const installSh = `#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
TARGET_NAME="${skillName}"

echo "📦 Installing \${TARGET_NAME} across AI agent environments..."

if [ -d "$HOME/.claude" ] || command -v claude >/dev/null 2>&1; then
  mkdir -p "$HOME/.claude/skills"
  rm -rf "$HOME/.claude/skills/\${TARGET_NAME}"
  cp -r "$SCRIPT_DIR" "$HOME/.claude/skills/\${TARGET_NAME}"
  echo "  ✅ Installed for Claude Code -> $HOME/.claude/skills/\${TARGET_NAME}"
fi

if [ -d "$HOME/.gemini" ]; then
  mkdir -p "$HOME/.gemini/config/skills"
  rm -rf "$HOME/.gemini/config/skills/\${TARGET_NAME}"
  cp -r "$SCRIPT_DIR" "$HOME/.gemini/config/skills/\${TARGET_NAME}"
  echo "  ✅ Installed for Antigravity / Gemini CLI -> $HOME/.gemini/config/skills/\${TARGET_NAME}"
fi

if [ -d "$HOME/.codex" ]; then
  mkdir -p "$HOME/.codex/skills"
  rm -rf "$HOME/.codex/skills/\${TARGET_NAME}"
  cp -r "$SCRIPT_DIR" "$HOME/.codex/skills/\${TARGET_NAME}"
  echo "  ✅ Installed for Codex / OpenCode -> $HOME/.codex/skills/\${TARGET_NAME}"
fi

mkdir -p "$HOME/.agents/skills"
rm -rf "$HOME/.agents/skills/\${TARGET_NAME}"
cp -r "$SCRIPT_DIR" "$HOME/.agents/skills/\${TARGET_NAME}"
echo "  ✅ Installed for Universal Agent Kernel -> $HOME/.agents/skills/\${TARGET_NAME}"

echo ""
echo "🎉 Installation complete!"
`;
  const installPath = path.join(absTarget, 'install.sh');
  await writeFile(installPath, installSh);
  await chmod(installPath, 0o755);

  // 5. bin/cli.js
  const cliJs = `#!/usr/bin/env node
console.log("${skillName} - Agent Skill & CLI runner");
`;
  const cliPath = path.join(absTarget, 'bin', 'cli.js');
  await writeFile(cliPath, cliJs);
  await chmod(cliPath, 0o755);

  // 6. .github/workflows/ci.yml
  const ciYml = `name: CI

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
          bun ./bin/cli.js

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Validate SKILL.md
        run: |
          python3 -c "
          content = open('SKILL.md').read()
          assert content.startswith('---'), 'Missing YAML frontmatter'
          assert 'name:' in content, 'Missing name'
          print('✅ SKILL.md validated successfully!')
          "
`;
  await writeFile(path.join(absTarget, '.github', 'workflows', 'ci.yml'), ciYml);

  // 7. LICENSE
  const licenseText = `MIT License

Copyright (c) 2026 ${author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
  await writeFile(path.join(absTarget, 'LICENSE'), licenseText);

  // 8. .gitignore
  const gitignoreText = `node_modules/
bun.lockb
package-lock.json
yarn.lock
pnpm-lock.yaml
.DS_Store
*.log
/tmp/
dist/*.zip
`;
  await writeFile(path.join(absTarget, '.gitignore'), gitignoreText);

  console.log(`[scaffold-repo] ✅ Successfully created all distribution files!`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) printUsage();

  let targetDir = args[0]!;
  let skillName = path.basename(path.resolve(targetDir));
  let author = 'Mamdouh Aboammar';
  let desc = 'Universal agent skill and CLI toolchain';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === '--name' && args[i + 1]) skillName = args[++i]!;
    else if (arg === '--author' && args[i + 1]) author = args[++i]!;
    else if (arg === '--desc' && args[i + 1]) desc = args[++i]!;
  }

  await scaffold(targetDir, skillName, author, desc);
}

if (import.meta.main) {
  await main().catch(err => {
    console.error(`[scaffold-repo] Error: ${err.message}`);
    process.exit(1);
  });
}
