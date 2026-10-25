import { validateSkillDirectory } from "../core/validator";
import { sanitizeDiagnosticPath, sanitizeFsError } from "../core/path-sanitizer";
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
    if (!p || p.trim().length === 0) {
      totalEvaluated++;
      totalErrors++;
      console.log(pc.cyan(`\n🔍 Validating Skill: ${pc.bold('""')}`));
      console.log(pc.red(`  ✖ [ERROR] (INVALID_ROOT) Root path does not exist or is not a directory: ""`));
      console.log(pc.red(`  ✖ Validation FAILED with 1 errors.`));
      continue;
    }

    const skillPath = resolve(process.cwd(), p);
    const safeDisplay = sanitizeDiagnosticPath(process.cwd(), skillPath);

    let stat;
    let rootError: { code: string; message: string } | null = null;
    try {
      stat = statSync(skillPath);
      if (!stat.isDirectory()) {
        rootError = {
          code: "INVALID_ROOT",
          message: `Root path does not exist or is not a directory: ${safeDisplay}`
        };
      }
    } catch (err: unknown) {
      const isAccess = (err as any)?.code === "EACCES" || (err as any)?.code === "EPERM";
      rootError = {
        code: isAccess ? "READ_FAILURE" : "INVALID_ROOT",
        message: isAccess
          ? `Cannot access root path (${sanitizeFsError(err)}): ${safeDisplay}`
          : `Root path does not exist or is not a directory: ${safeDisplay}`
      };
    }

    if (rootError) {
      totalEvaluated++;
      totalErrors++;
      console.log(pc.cyan(`\n🔍 Validating Skill: ${pc.bold(safeDisplay)}`));
      console.log(pc.red(`  ✖ [ERROR] (${rootError.code}) ${rootError.message}`));
      console.log(pc.red(`  ✖ Validation FAILED with 1 errors.`));
      continue;
    }

    totalEvaluated++;
    const result = validateSkillDirectory(skillPath);
    console.log(pc.cyan(`\n🔍 Validating Skill: ${pc.bold(safeDisplay)}`));

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
  if (totalErrors > 0 || totalPassed < totalEvaluated || totalEvaluated === 0) {
    process.exit(1);
  }
}
