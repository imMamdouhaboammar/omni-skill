import pc from "picocolors";
import { resolve } from "node:path";
import { loadSkillDirectory } from "../core/parser";
import { generateAdapter } from "../core/adapters";

export function portSkillCommand(skillPathArg: string, options: { target: string; out?: string }) {
  const skillPath = resolve(process.cwd(), skillPathArg);
  const outDir = options.out ? resolve(process.cwd(), options.out) : process.cwd();
  const manifest = loadSkillDirectory(skillPath);

  console.log(pc.cyan(`\n📦 Porting ${pc.bold(manifest.name)} to target host: ${pc.bold(options.target)}\n`));

  const result = generateAdapter(manifest, options.target, outDir);

  for (const file of result.filesGenerated) {
    console.log(pc.green(`  ✔ Generated: `) + pc.bold(file));
  }
  for (const note of result.notes) {
    console.log(pc.cyan(`  ℹ ${note}`));
  }

  console.log(pc.green(`\n✔ Porting to ${options.target} completed successfully!`));
}
