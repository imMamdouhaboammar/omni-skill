import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { compileOmniSkillSpec } from "../core/compiler";
import pc from "picocolors";

export function compileSkillCommand(specPathArg: string, options: { out?: string }) {
  const specPath = resolve(process.cwd(), specPathArg);
  const raw = readFileSync(specPath, "utf-8");
  const spec = JSON.parse(raw);
  const outDir = options.out ? resolve(process.cwd(), options.out) : process.cwd();

  const compiledPath = compileOmniSkillSpec(spec, outDir);
  console.log(pc.green(`✔ Compiled OmniSkillSpec to: `) + pc.bold(compiledPath));
}
