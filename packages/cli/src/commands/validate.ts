import { validateSkillDirectory } from "../core/validator";
import { sanitizeDiagnosticPath, sanitizeFsError } from "../core/path-sanitizer";
import pc from "picocolors";
import { resolve } from "node:path";
import { statSync } from "node:fs";

/**
 * Inspects an explicit skill root path to verify it exists and is a readable directory.
 * Returns either ok: true with resolved paths or ok: false with structured failure diagnostics.
 */
export function inspectSkillRoot(rawPath: string):
  | { ok: true; skillPath: string; safeDisplay: string }
  | { ok: false; code: string; message: string; safeDisplay: string } {
  if (!rawPath || rawPath.trim().length === 0) {
    return {
      ok: false,
      code: "INVALID_ROOT",
      message: 'Root path does not exist or is not a directory: ""',
      safeDisplay: '""'
    };
  }

  const skillPath = resolve(process.cwd(), rawPath);
  const safeDisplay = sanitizeDiagnosticPath(process.cwd(), skillPath);

  try {
    const stat = statSync(skillPath);
    if (!stat.isDirectory()) {
      return {
        ok: false,
        code: "INVALID_ROOT",
        message: `Root path does not exist or is not a directory: ${safeDisplay}`,
        safeDisplay
      };
    }
    return { ok: true, skillPath, safeDisplay };
  } catch (err: unknown) {
    const isAccess = (err as any)?.code === "EACCES" || (err as any)?.code === "EPERM";
    return {
      ok: false,
      code: isAccess ? "READ_FAILURE" : "INVALID_ROOT",
      message: isAccess
        ? `Cannot access root path (${sanitizeFsError(err)}): ${safeDisplay}`
        : `Root path does not exist or is not a directory: ${safeDisplay}`,
      safeDisplay
    };
  }
}

/**
 * Executes skill validation across one or more target skill directories.
 * Conforms to fail-closed CLI requirements: exits 1 if any root is invalid,
 * unreadable, or contains validation errors.
 */
export function validateSkillCommand(pathArg: string | string[]) {
  const rawPaths = Array.isArray(pathArg) ? pathArg : [pathArg];
  const paths = rawPaths.length > 0 ? rawPaths : ["."];
  
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalPassed = 0;
  let totalEvaluated = 0;

  for (const p of paths) {
    const rootCheck = inspectSkillRoot(p);

    if (!rootCheck.ok) {
      totalEvaluated++;
      totalErrors++;
      console.log(pc.cyan(`\n🔍 Validating Skill: ${pc.bold(rootCheck.safeDisplay)}`));
      console.log(pc.red(`  ✖ [ERROR] (${rootCheck.code}) ${rootCheck.message}`));
      console.log(pc.red(`  ✖ Validation FAILED with 1 errors.`));
      continue;
    }

    totalEvaluated++;
    const result = validateSkillDirectory(rootCheck.skillPath);
    console.log(pc.cyan(`\n🔍 Validating Skill: ${pc.bold(rootCheck.safeDisplay)}`));

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
