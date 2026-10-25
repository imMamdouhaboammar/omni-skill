import pc from "picocolors";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { unzipSync, zipSync } from "fflate";
import { validateSkillDirectory } from "../core/validator";
import {
  scanSkillDirectory,
  shouldExcludeSkillFile,
} from "../core/security";
import { sanitizeDiagnosticPath } from "../core/path-sanitizer";

export function collectSkillFiles(skillDir: string, name: string): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};

  function walk(directory: string, prefix: string) {
    for (const entry of readdirSync(directory).sort()) {
      const fullPath = join(directory, entry);
      const relPath = relative(skillDir, fullPath).replace(/\\/g, "/");
      if (shouldExcludeSkillFile(relPath)) continue;

      const stat = lstatSync(fullPath);
      if (stat.isSymbolicLink()) {
        throw new Error(`Refusing to package symbolic link: ${fullPath}`);
      }
      if (stat.isDirectory()) {
        walk(fullPath, `${prefix}${entry}/`);
      } else if (stat.isFile()) {
        files[`${prefix}${entry}`] = readFileSync(fullPath);
      }
    }
  }

  walk(skillDir, `${name}/`);
  return files;
}

/**
 * Reopens and verifies the temporary archive structure and byte integrity.
 */
export function verifyArchiveIntegrity(
  archiveBytes: Uint8Array,
  skillPath: string,
  skillName: string
): { ok: true } | { ok: false; reason: string } {
  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(archiveBytes);
  } catch (err: unknown) {
    return { ok: false, reason: "Decompression error: corrupted ZIP archive bytes" };
  }

  const entryKeys = Object.keys(unzipped);
  if (entryKeys.length === 0) {
    return { ok: false, reason: "Archive contains zero entries" };
  }

  // 1. Root entry folder <name>/
  for (const key of entryKeys) {
    if (!key.startsWith(`${skillName}/`)) {
      return {
        ok: false,
        reason: `Archive entry does not reside within root folder '${skillName}/': ${key}`,
      };
    }
  }

  // 2. Required <name>/SKILL.md present and non-empty
  const skillMdKey = `${skillName}/SKILL.md`;
  if (!unzipped[skillMdKey] || unzipped[skillMdKey].length === 0) {
    return {
      ok: false,
      reason: `Required '${skillMdKey}' is missing or empty inside archive`,
    };
  }

  // 3. Prohibited files (.env, hidden files, forbidden extensions)
  for (const key of entryKeys) {
    const rel = key.slice(skillName.length + 1);
    if (!rel || rel.endsWith("/")) continue;

    if (shouldExcludeSkillFile(rel)) {
      return {
        ok: false,
        reason: `Archive contains prohibited or excluded file: ${rel}`,
      };
    }

    const lower = rel.toLowerCase();
    if (
      lower.includes(".env") ||
      lower.startsWith(".") ||
      lower.includes("/.") ||
      lower.endsWith(".pyc") ||
      lower.endsWith(".pyo")
    ) {
      return {
        ok: false,
        reason: `Archive contains prohibited sensitive or hidden file: ${rel}`,
      };
    }
  }

  // 4. File byte integrity matches source files
  for (const key of entryKeys) {
    const rel = key.slice(skillName.length + 1);
    if (!rel || rel.endsWith("/")) continue;

    const sourceFilePath = join(skillPath, rel);
    if (!existsSync(sourceFilePath)) {
      return {
        ok: false,
        reason: `Archived file not found in source directory: ${rel}`,
      };
    }

    const sourceBytes = readFileSync(sourceFilePath);
    const archivedBytes = unzipped[key];
    if (sourceBytes.length !== archivedBytes.length) {
      return {
        ok: false,
        reason: `File size mismatch for ${rel}: expected ${sourceBytes.length} bytes, archived ${archivedBytes.length} bytes`,
      };
    }

    for (let i = 0; i < sourceBytes.length; i++) {
      if (sourceBytes[i] !== archivedBytes[i]) {
        return {
          ok: false,
          reason: `Byte content mismatch at offset ${i} for ${rel}`,
        };
      }
    }
  }

  return { ok: true };
}

export function packageSkillCommand(skillPathArg: string, options?: { out?: string }) {
  const skillPath = resolve(process.cwd(), skillPathArg);

  // 1. Fail-closed frontmatter and schema validation
  const val = validateSkillDirectory(skillPath);
  if (!val.pass) {
    console.log(pc.red(`✖ Cannot package skill with validation errors.`));
    process.exit(1);
  }

  // 2. Output path verification and collision check before any write
  const outDir = options?.out ? resolve(process.cwd(), options.out) : process.cwd();
  if (outDir === skillPath || outDir.startsWith(`${skillPath}${sep}`)) {
    console.log(pc.red("✖ Output directory must be outside the skill being packaged."));
    process.exit(1);
  }

  const skillName = basename(skillPath);
  const archivePath = join(outDir, `${skillName}.skill`);
  if (existsSync(archivePath)) {
    console.log(pc.red(`✖ Refusing to overwrite existing package: ${archivePath}`));
    process.exit(1);
  }

  // 3. Security preflight check (matching scan_skill_security.py parity)
  let secReport;
  try {
    secReport = scanSkillDirectory(skillPath);
  } catch (err: unknown) {
    console.log(pc.red(`✖ Security scan failed unexpectedly: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }

  if (!secReport.passed) {
    console.log(
      pc.red(
        `✖ Security pre-flight failed: ${secReport.recommendation} (Score: ${secReport.riskScore}/100, Band: ${secReport.severity})`
      )
    );
    for (const f of secReport.findings) {
      if (f.severity === "CRITICAL" || f.severity === "HIGH") {
        const safeFile = sanitizeDiagnosticPath(skillPath, f.file);
        console.log(pc.red(`  - [${f.severity}] ${f.ruleId}: ${f.message} (${safeFile}:${f.line})`));
      }
    }
    console.log(pc.red("✖ Packaging aborted fail-closed. Remediate security findings before packaging."));
    process.exit(1);
  }

  // 4. Temporary archive creation and atomic publication
  mkdirSync(outDir, { recursive: true });
  const tempArchivePath = join(outDir, `${skillName}.skill.tmp.${process.pid}.${Date.now()}`);

  try {
    const files = collectSkillFiles(skillPath, skillName);
    const archive = zipSync(files, { level: 6 });
    writeFileSync(tempArchivePath, archive, { flag: "wx" });

    // 5. Reopen archive and verify integrity
    const tempBytes = readFileSync(tempArchivePath);
    const integrity = verifyArchiveIntegrity(tempBytes, skillPath, skillName);
    if (!integrity.ok) {
      console.log(pc.red(`✖ Archive integrity check failed: ${integrity.reason}`));
      if (existsSync(tempArchivePath)) {
        rmSync(tempArchivePath, { force: true });
      }
      process.exit(1);
    }

    // 6. Atomic publication to final location
    renameSync(tempArchivePath, archivePath);

    console.log(pc.cyan(`\n📦 Packaging skill: ${pc.bold(val.skill)}`));
    console.log(pc.green("✔ Validation passed for all inspected files."));
    console.log(pc.green(`✔ Security pre-flight passed: ${secReport.recommendation} (Score: ${secReport.riskScore}/100)`));
    console.log(pc.green("✔ Archive integrity verified."));
    console.log(pc.green(`✔ Package ready for distribution: `) + pc.bold(archivePath));
  } catch (err: unknown) {
    if (existsSync(tempArchivePath)) {
      rmSync(tempArchivePath, { force: true });
    }
    console.log(pc.red(`✖ Packaging failed: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
