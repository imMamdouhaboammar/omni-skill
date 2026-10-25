import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { compileOmniSkillSpec } from "../core/compiler";
import pc from "picocolors";

export function compileSkillCommand(specPathArg: string, options: { out?: string }) {
  const specPath = resolve(process.cwd(), specPathArg);
  if (!existsSync(specPath)) {
    console.log(pc.red(`✖ Specification file not found: ${specPath}`));
    process.exit(1);
  }

  let spec: any;
  try {
    const raw = readFileSync(specPath, "utf-8");
    spec = JSON.parse(raw);
  } catch (err: any) {
    console.log(pc.red(`✖ Failed to parse JSON specification: ${err.message}`));
    process.exit(1);
  }

  const outDir = options.out ? resolve(process.cwd(), options.out) : process.cwd();
  const compiledPath = compileOmniSkillSpec(spec, outDir);
  console.log(pc.green(`✔ Compiled OmniSkillSpec to: `) + pc.bold(compiledPath));
}
