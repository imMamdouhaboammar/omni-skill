#!/usr/bin/env bun
import { Command } from "commander";
import { initSkillCommand } from "./commands/init";
import { validateSkillCommand } from "./commands/validate";
import { compileSkillCommand } from "./commands/compile";
import { portSkillCommand } from "./commands/port";
import { evalSkillCommand } from "./commands/eval";
import { packageSkillCommand } from "./commands/package";
import { routeCommand } from "./commands/route";

const program = new Command();

program
  .name("omni-skill")
  .description("Universal Cross-Host Agent Skill Engine & Compiler")
  .version("5.0.0");

program
  .command("route <prompt>")
  .description("Dynamic and smart agentic router: analyze prompt and generate optimal execution DAG")
  .option("-h, --host <host>", "Target host agent (claude, antigravity, cursor, codex, windsurf)")
  .option("-j, --json", "Output JSON execution graph")
  .option("-e, --explain", "Explain router decision and rationale")
  .action((prompt, options) => {
    routeCommand(prompt, options);
  });

program
  .command("init <name>")
  .description("Initialize a new production-grade OmniSkill package")
  .option("-d, --description <desc>", "Skill description")
  .action((name, options) => {
    initSkillCommand(name, options);
  });

program
  .command("validate <path>")
  .description("Validate skill frontmatter, security, secrets, and portability")
  .action((path) => {
    validateSkillCommand(path);
  });

program
  .command("compile <spec>")
  .description("Compile an OmniSkillSpec JSON into a full skill tree")
  .option("-o, --out <dir>", "Output directory")
  .action((spec, options) => {
    compileSkillCommand(spec, options);
  });

program
  .command("port <path>")
  .description("Port a skill to a specific agent host (chatgpt, codex, claude, antigravity)")
  .requiredOption("-t, --target <host>", "Target host")
  .action((path, options) => {
    portSkillCommand(path, options);
  });

program
  .command("eval <path>")
  .description("Run BinEval and held-out evaluation checks on a skill")
  .action((path) => {
    evalSkillCommand(path);
  });

program
  .command("package <path>")
  .description("Validate and package a skill for release")
  .action((path) => {
    packageSkillCommand(path);
  });

program.parse(process.argv);
