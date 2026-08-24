import { validateSkillDirectory } from "../core/validator";
import pc from "picocolors";
import { resolve } from "node:path";

export function validateSkillCommand(pathArg: string) {
  const skillPath = resolve(process.cwd(), pathArg);
  const result = validateSkillDirectory(skillPath);

  console.log(pc.cyan(`\n🔍 Validating Skill: ${pc.bold(result.skill)}\n`));

  if (result.findings.length === 0) {
    console.log(pc.green("✔ 0 errors, 0 warnings. Perfectly formatted OmniSkill!"));
    return;
  }

  for (const f of result.findings) {
    if (f.severity === "error") {
      console.log(pc.red(`  ✖ [ERROR] (${f.code}) ${f.message}`));
    } else {
      console.log(pc.yellow(`  ⚠ [WARN]  (${f.code}) ${f.message}`));
    }
  }

  console.log("");
  if (result.pass) {
    console.log(pc.green(`✔ Validation PASSED (${result.warnings} warnings)`));
  } else {
    console.log(pc.red(`✖ Validation FAILED with ${result.errors} errors.`));
    process.exit(1);
  }
}
