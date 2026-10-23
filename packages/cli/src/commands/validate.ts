import { validateSkillDirectory } from "../core/validator";
import pc from "picocolors";
import { resolve } from "node:path";
import { statSync } from "node:fs";

export function validateSkillCommand(pathArg: string | string[]) {
  const rawPaths = Array.isArray(pathArg) ? pathArg : [pathArg];
  const paths = rawPaths.length > 0 ? rawPaths : ["."];
  
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalPassed = 0;
  let totalEvaluated = 0;

  for (const p of paths) {
    const skillPath = resolve(process.cwd(), p);
    try {
      if (!statSync(skillPath).isDirectory()) continue;
    } catch {
      continue;
    }

    totalEvaluated++;
    const result = validateSkillDirectory(skillPath);
    console.log(pc.cyan(`\n🔍 Validating Skill: ${pc.bold(result.skill)}`));

    if (result.findings.length === 0) {
      console.log(pc.green("  ✔ 0 errors, 0 warnings. Perfectly formatted OmniSkill!"));
      totalPassed++;
      continue;
    }

    for (const f of result.findings) {
      if (f.severity === "error") {
        console.log(pc.red(`  ✖ [ERROR] (${f.code}) ${f.message}`));
      } else {
        console.log(pc.yellow(`  ⚠ [WARN]  (${f.code}) ${f.message}`));
      }
    }

    totalErrors += result.errors;
    totalWarnings += result.warnings;
    if (result.pass) {
      totalPassed++;
      console.log(pc.green(`  ✔ Validation PASSED (${result.warnings} warnings)`));
    } else {
      console.log(pc.red(`  ✖ Validation FAILED with ${result.errors} errors.`));
    }
  }

  console.log(pc.bold(`\n📊 Summary: ${totalPassed}/${totalEvaluated} skills valid (${totalErrors} errors, ${totalWarnings} warnings)\n`));
  if (totalErrors > 0) {
    process.exit(1);
  }
}
