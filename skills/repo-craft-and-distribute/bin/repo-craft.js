#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scaffoldScript = path.resolve(__dirname, '..', 'scripts', 'scaffold-repo.ts');

const args = process.argv.slice(2);
const child = spawn('bun', [scaffoldScript, ...args], { stdio: 'inherit' });

child.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('Error: "bun" runtime is required. Install from https://bun.sh');
  } else {
    console.error('Execution error:', err.message);
  }
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
