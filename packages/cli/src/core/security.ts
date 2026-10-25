/**
 * Deterministic Pure-TypeScript Agent Skill Security Scanner
 * Reverse-Engineered from SkillSpector architecture (matching scan_skill_security.py).
 */

import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import {
  PatternCategory,
  SecurityFinding,
  SecurityScanReport,
  SecuritySeverity,
} from "./security-types";
import { DEFAULT_EXPLANATIONS, DEFAULT_REMEDIATIONS } from "./security-metadata";
import {
  isSafeBinaryAsset,
  isScriptFile,
  shouldExcludeSkillFile,
} from "./security-exclusions";
import { isDirectlyProhibited } from "./security-prohibition";
import { PATTERNS_DATABASE } from "./security-patterns";
import {
  analyzeBehavioralSinks,
  analyzeWhitespacePadding,
  checkLanguageDeserialization,
  checkLeastPrivilegeFrontmatter,
  checkSupplyChainDependencies,
  ZERO_WIDTH_CHARS,
} from "./security-specialized";
import { computeRiskScore, RISK_THRESHOLD } from "./security-scoring";
import { sanitizeDiagnosticPath } from "./path-sanitizer";

export * from "./security-types";
export * from "./security-metadata";
export * from "./security-exclusions";
export * from "./security-prohibition";
export * from "./security-patterns";
export * from "./security-specialized";
export * from "./security-scoring";

/**
 * Parses frontmatter YAML block from SKILL.md.
 */
export function parseSkillFrontmatter(content: string): Record<string, unknown> | null {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) {
    return null;
  }
  const endMatch = content.slice(4).match(/(?:^|\r?\n)---(?:\r?\n|$)/);
  if (!endMatch || endMatch.index === undefined) {
    return null;
  }
  const yamlBlock = content.slice(4, 4 + endMatch.index);
  try {
    const parsed = parseYaml(yamlBlock);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // If YAML fails, fallback to simple key-value parsing matching Python
    const result: Record<string, unknown> = {};
    for (const line of yamlBlock.split(/\r?\n/)) {
      const colonIdx = line.indexOf(":");
      if (colonIdx !== -1) {
        const k = line.slice(0, colonIdx).trim();
        const v = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, "");
        result[k] = v;
      }
    }
    return result;
  }
  return null;
}

/**
 * Scans arbitrary text content across all pattern categories.
 */
export function scanSkillText(
  content: string,
  fileRel: string,
  options?: {
    isScript?: boolean;
    skillManifest?: Record<string, unknown> | null;
  }
): SecurityFinding[] {
  const isScript = options?.isScript ?? false;
  const manifest = options?.skillManifest ?? null;
  const findings: SecurityFinding[] = [];
  const lines = content.split(/\r?\n/);

  function getLineContext(lineNum: number): string {
    const idx = Math.max(0, lineNum - 1);
    const extraLines: string[] = [];
    if (idx < lines.length && lines[idx].trim().startsWith("|")) {
      let curr = idx;
      while (curr >= 0 && lines[curr].trim().startsWith("|")) {
        curr--;
      }
      if (curr + 1 <= idx && curr + 1 < lines.length) {
        extraLines.push(lines[curr + 1]);
      }
    }
    const start = Math.max(0, idx - 10);
    const end = Math.min(lines.length, idx + 4);
    return [...extraLines, ...lines.slice(start, end)].join("\n");
  }

  // 1. Zero-width character scan
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const foundZw: string[] = [];
    for (const ch of line) {
      if (ZERO_WIDTH_CHARS.has(ch)) {
        foundZw.push(ch);
      }
    }
    if (foundZw.length > 0) {
      findings.push({
        ruleId: "P2",
        message: `Concealed zero-width steganography detected (${foundZw.length} invisible chars)`,
        severity: "HIGH",
        category: PatternCategory.PROMPT_INJECTION,
        file: fileRel,
        line: idx + 1,
        matchedText: "[ZERO_WIDTH_CHARS]",
        confidence: 0.9,
        explanation: DEFAULT_EXPLANATIONS["P2"],
        remediation: DEFAULT_REMEDIATIONS["P2"],
        context: line.slice(0, 100),
      });
    }
  }

  // 2. Whitespace padding scan (P9)
  findings.push(...analyzeWhitespacePadding(content, fileRel));

  // 3. Supply chain dependency scan (SC1)
  findings.push(...checkSupplyChainDependencies(content, fileRel));

  // 4. Multi-language deserialization (DS1-DS4)
  findings.push(...checkLanguageDeserialization(content, fileRel));

  // 5. Static pattern database scan
  for (const rule of PATTERNS_DATABASE) {
    for (const { regex: patStr, confidence } of rule.patterns) {
      const reg = new RegExp(patStr, "gim");
      let match: RegExpExecArray | null;
      while ((match = reg.exec(content)) !== null) {
        const matchStart = match.index;
        const matchEnd = matchStart + match[0].length;

        // Check prohibition context (defense vs attack)
        if (!isScript && isDirectlyProhibited(content, matchStart, matchEnd)) {
          continue;
        }

        const lineNum = content.slice(0, matchStart).split("\n").length;
        const matchedSnippet = match[0].slice(0, 120);
        const context = getLineContext(lineNum);

        findings.push({
          ruleId: rule.ruleId,
          message: rule.name,
          severity: rule.severity,
          category: rule.category,
          file: fileRel,
          line: lineNum,
          matchedText: matchedSnippet,
          confidence,
          explanation: DEFAULT_EXPLANATIONS[rule.ruleId] || "",
          remediation: DEFAULT_REMEDIATIONS[rule.ruleId] || "",
          context,
        });
      }
    }
  }

  // 6. Behavioral code sinks & AST analysis
  if (isScript || fileRel.endsWith(".py")) {
    findings.push(...analyzeBehavioralSinks(content, fileRel, isScript));
  }

  // 7. MCP Least Privilege checks (if inspecting SKILL.md frontmatter)
  if (fileRel.endsWith("SKILL.md") && manifest) {
    findings.push(...checkLeastPrivilegeFrontmatter(manifest, fileRel));
  }

  return findings;
}

/**
 * Scans a skill directory completely, applying all security gates.
 */
export function scanSkillDirectory(skillDirArg: string): SecurityScanReport {
  const skillDir = join(skillDirArg);
  const skillMdPath = join(skillDir, "SKILL.md");

  let skillName = basename(skillDir);
  let manifest: Record<string, unknown> | null = null;

  if (existsSync(skillMdPath)) {
    try {
      const content = readFileSync(skillMdPath, "utf-8");
      manifest = parseSkillFrontmatter(content);
      if (manifest && typeof manifest.name === "string") {
        skillName = manifest.name;
      }
    } catch {
      // ignore
    }
  }

  const allFindings: SecurityFinding[] = [];
  let filesAnalyzed = 0;
  const scriptFiles = new Set<string>();

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir).sort();
    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const relPath = relative(skillDir, fullPath).replace(/\\/g, "/");

      if (shouldExcludeSkillFile(relPath)) {
        continue;
      }

      const stat = lstatSync(fullPath);
      if (stat.isSymbolicLink()) {
        allFindings.push({
          ruleId: "SC9",
          message: "Symbolic link cannot be safely packaged",
          severity: "HIGH",
          category: PatternCategory.SUPPLY_CHAIN,
          file: relPath,
          line: 1,
          matchedText: relPath,
          confidence: 1.0,
          explanation: DEFAULT_EXPLANATIONS["SC9"],
          remediation: DEFAULT_REMEDIATIONS["SC9"],
        });
        continue;
      }

      if (stat.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!stat.isFile()) {
        continue;
      }

      filesAnalyzed++;
      const dotIdx = entry.lastIndexOf(".");
      const ext = dotIdx !== -1 ? entry.slice(dotIdx).toLowerCase() : "";

      let contentBytes: Uint8Array;
      try {
        contentBytes = readFileSync(fullPath);
      } catch (err: unknown) {
        throw new Error(`cannot inspect ${relPath}`);
      }

      // Check safe media signatures
      if (isSafeBinaryAsset(ext, contentBytes)) {
        continue;
      }

      // Detect binary
      let isBinary = false;
      let textContent = "";
      try {
        textContent = new TextDecoder("utf-8", { fatal: true }).decode(contentBytes);
        if (textContent.includes("\0")) {
          isBinary = true;
        }
      } catch {
        isBinary = true;
      }

      if (ext === ".pyo" || isBinary) {
        allFindings.push({
          ruleId: ext === ".pyo" ? "SC8" : "SC9",
          message: `Unreviewable executable or binary asset: ${relPath}`,
          severity: "HIGH",
          category: PatternCategory.SUPPLY_CHAIN,
          file: relPath,
          line: 1,
          matchedText: relPath,
          confidence: 1.0,
          explanation: DEFAULT_EXPLANATIONS[ext === ".pyo" ? "SC8" : "SC9"],
          remediation: DEFAULT_REMEDIATIONS[ext === ".pyo" ? "SC8" : "SC9"],
        });
        continue;
      }

      const isScript = isScriptFile(relPath, textContent, stat.mode);
      if (isScript) {
        scriptFiles.add(relPath);
      }

      allFindings.push(
        ...scanSkillText(textContent, relPath, {
          isScript,
          skillManifest: relPath === "SKILL.md" ? manifest : null,
        })
      );
    }
  }

  walk(skillDir);

  const evalResult = computeRiskScore(
    allFindings,
    scriptFiles.size > 0,
    scriptFiles
  );

  const highRisk = allFindings.some(
    (f) => f.severity === "CRITICAL" || f.severity === "HIGH"
  );
  const passed =
    (evalResult.recommendation === "APPROVE" ||
      evalResult.recommendation === "CAUTION") &&
    evalResult.riskScore < RISK_THRESHOLD &&
    !highRisk;

  return {
    targetPath: skillDir,
    skillName,
    riskScore: evalResult.riskScore,
    severity: evalResult.severity,
    recommendation: evalResult.recommendation,
    findings: allFindings,
    filesAnalyzed,
    passed,
  };
}

/**
 * Formats a scan report for terminal output.
 */
export function formatSecurityReportTerminal(report: SecurityScanReport): string {
  const lines: string[] = [];
  lines.push("=================================================================");
  lines.push(`  SKILL SECURITY SCAN: ${report.skillName}`);
  lines.push(`  Target: ${report.targetPath}`);
  lines.push(`  Files Analyzed: ${report.filesAnalyzed}`);
  lines.push("-----------------------------------------------------------------");
  const statusIcon = report.passed ? "✓" : "✗";
  lines.push(`  Verdict:        [${statusIcon}] ${report.recommendation}`);
  lines.push(`  Risk Score:     ${report.riskScore} / 100`);
  lines.push(`  Severity Band:  ${report.severity}`);
  lines.push("=================================================================");

  if (report.findings.length === 0) {
    lines.push("\n  [OK] No security vulnerabilities or malicious patterns detected.");
    return lines.join("\n");
  }

  lines.push(`\n  Findings (${report.findings.length}):`);
  for (let idx = 0; idx < report.findings.length; idx++) {
    const f = report.findings[idx];
    lines.push(`\n  [${idx + 1}] [${f.severity}] ${f.ruleId}: ${f.message}`);
    lines.push(`      Category: ${f.category}`);
    lines.push(`      Location: ${f.file}:${f.line}`);
    lines.push(`      Matched:  ${f.matchedText}`);
    if (f.explanation) lines.push(`      Why:      ${f.explanation}`);
    if (f.remediation) lines.push(`      Fix:      ${f.remediation}`);
  }

  return lines.join("\n");
}

/**
 * Formats a scan report as JSON string.
 */
export function formatSecurityReportJson(report: SecurityScanReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Formats a scan report as SARIF 2.1.0 string for GitHub code scanning integration.
 */
export function formatSecurityReportSarif(report: SecurityScanReport): string {
  const rulesMap = new Map<string, any>();
  const results: any[] = [];

  for (const f of report.findings) {
    if (!rulesMap.has(f.ruleId)) {
      rulesMap.set(f.ruleId, {
        id: f.ruleId,
        name: f.ruleId,
        shortDescription: { text: f.message },
        fullDescription: { text: f.explanation || f.message },
        help: { text: f.remediation || "Review code for security risks." },
        defaultConfiguration: {
          level: f.severity === "CRITICAL" || f.severity === "HIGH" ? "error" : "warning",
        },
        properties: {
          category: f.category,
          precision: "high",
          "security-severity":
            f.severity === "CRITICAL" ? "9.0" : f.severity === "HIGH" ? "7.0" : "4.0",
        },
      });
    }

    results.push({
      ruleId: f.ruleId,
      level: f.severity === "CRITICAL" || f.severity === "HIGH" ? "error" : "warning",
      message: { text: `${f.message}: ${f.explanation || ""}` },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: f.file },
            region: { startLine: f.line },
          },
        },
      ],
    });
  }

  const sarifData = {
    $schema:
      "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "omni-skill-security-scanner",
            version: "2.0.0",
            informationUri: "https://github.com/imMamdouhaboammar/omni-skill",
            rules: Array.from(rulesMap.values()),
          },
        },
        results,
      },
    ],
  };

  return JSON.stringify(sarifData, null, 2);
}
