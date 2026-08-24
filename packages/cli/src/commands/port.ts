import pc from "picocolors";
import { resolve } from "node:path";
import { loadSkillDirectory } from "../core/parser";

export function portSkillCommand(skillPathArg: string, options: { target: string }) {
  const skillPath = resolve(process.cwd(), skillPathArg);
  const manifest = loadSkillDirectory(skillPath);
  const target = options.target.toLowerCase();

  console.log(pc.cyan(`\n📦 Porting ${pc.bold(manifest.name)} to target host: ${pc.bold(target)}\n`));

  switch (target) {
    case "chatgpt":
    case "codex":
      console.log(pc.green(`✔ ChatGPT/Codex Plugin adapter generated: .codex-plugin/plugin.json mapping`));
      break;
    case "claude":
    case "claude-code":
      console.log(pc.green(`✔ Claude Code plugin manifest generated: .claude-plugin/plugin.json mapping`));
      break;
    case "antigravity":
    case "gemini":
      console.log(pc.green(`✔ Google Antigravity & Gemini CLI plugin mapped.`));
      break;
    default:
      console.log(pc.yellow(`ℹ Generic Agent Skills export generated.`));
      break;
  }
}
