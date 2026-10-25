import pc from "picocolors";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve, sep } from "node:path";
import { zipSync } from "fflate";
import { validateSkillDirectory } from "../core/validator";

function collectSkillFiles(skillDir: string, name: string): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};

  function walk(directory: string, prefix: string) {
    for (const entry of readdirSync(directory).sort()) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "__pycache__" || entry.startsWith("test_") || entry.endsWith(".test.ts") || entry.endsWith(".test.py")) continue;
      const fullPath = join(directory, entry);
      const stat = lstatSync(fullPath);
      if (stat.isSymbolicLink()) throw new Error(`Refusing to package symbolic link: ${fullPath}`);
      if (stat.isDirectory()) walk(fullPath, `${prefix}${entry}/`);
      else if (stat.isFile()) files[`${prefix}${entry}`] = readFileSync(fullPath);
    }
  }

  walk(skillDir, `${name}/`);
  return files;
}

export function packageSkillCommand(skillPathArg: string, options?: { out?: string }) {
  const skillPath = resolve(process.cwd(), skillPathArg);
  const val = validateSkillDirectory(skillPath);

  if (!val.pass) {
    console.log(pc.red(`✖ Cannot package skill with validation errors.`));
    process.exit(1);
  }

  const outDir = options?.out ? resolve(process.cwd(), options.out) : process.cwd();
  if (outDir === skillPath || outDir.startsWith(`${skillPath}${sep}`)) {
    console.log(pc.red("✖ Output directory must be outside the skill being packaged."));
    process.exit(1);
  }
  const archivePath = join(outDir, `${basename(skillPath)}.skill`);
  if (existsSync(archivePath)) {
    console.log(pc.red(`✖ Refusing to overwrite existing package: ${archivePath}`));
    process.exit(1);
  }

  const archive = zipSync(collectSkillFiles(skillPath, basename(skillPath)), { level: 6 });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(archivePath, archive, { flag: "wx" });
  console.log(pc.cyan(`\n📦 Packaging skill: ${pc.bold(val.skill)}`));
  console.log(pc.green("✔ Validation passed for all inspected files."));
  console.log(pc.green(`✔ Package ready for distribution: `) + pc.bold(archivePath));
}
