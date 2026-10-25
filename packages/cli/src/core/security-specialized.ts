/**
 * Specialized analyzers for Whitespace Padding, Steganography, Supply Chain,
 * Language Deserialization, AST Behavioral Sinks, and MCP Least Privilege.
 */

import { SecurityFinding, PatternCategory } from "./security-types";
import { DEFAULT_EXPLANATIONS, DEFAULT_REMEDIATIONS } from "./security-metadata";

export const ZERO_WIDTH_CHARS = new Set(["\u200B", "\u200C", "\u200D", "\u2060", "\uFEFF"]);

export function isDependencyManifest(filePath: string): boolean {
  const lower = filePath.replace(/\\/g, "/").toLowerCase();
  const base = lower.split("/").pop() || "";
  return (
    base.startsWith("requirements") ||
    ["package.json", "pyproject.toml", "setup.py", "pipfile", "environment.yml"].includes(base)
  );
}

/**
 * P9: Whitespace padding and steganography analysis.
 */
export function analyzeWhitespacePadding(content: string, filename: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const lines = content.split(/\r?\n/);

  // 1. Vertical consecutive blank lines (>= 20)
  let consecutiveBlank = 0;
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    if (!line.trim()) {
      if (consecutiveBlank === 0) {
        startLine = lineNum;
      }
      consecutiveBlank++;
    } else {
      if (consecutiveBlank >= 20) {
        findings.push({
          ruleId: "P9",
          message: `Vertical whitespace padding: ${consecutiveBlank} consecutive blank lines`,
          severity: consecutiveBlank >= 40 ? "HIGH" : "MEDIUM",
          category: PatternCategory.PROMPT_INJECTION,
          file: filename,
          line: startLine,
          matchedText: `${consecutiveBlank} blank lines`,
          confidence: 0.85,
          explanation: DEFAULT_EXPLANATIONS["P9"],
          remediation: DEFAULT_REMEDIATIONS["P9"],
        });
      }
      consecutiveBlank = 0;
    }
  }

  if (consecutiveBlank >= 20) {
    findings.push({
      ruleId: "P9",
      message: `Vertical whitespace padding: ${consecutiveBlank} consecutive trailing blank lines`,
      severity: consecutiveBlank >= 40 ? "HIGH" : "MEDIUM",
      category: PatternCategory.PROMPT_INJECTION,
      file: filename,
      line: startLine,
      matchedText: `${consecutiveBlank} blank lines`,
      confidence: 0.85,
      explanation: DEFAULT_EXPLANATIONS["P9"],
      remediation: DEFAULT_REMEDIATIONS["P9"],
    });
  }

  // 2. Horizontal runs of >= 80 padding characters on a single line
  const horizontalPaddingRegex = /[ \t]{80,}/g;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      continue;
    }
    let match: RegExpExecArray | null;
    horizontalPaddingRegex.lastIndex = 0;
    while ((match = horizontalPaddingRegex.exec(line)) !== null) {
      findings.push({
        ruleId: "P9",
        message: `Horizontal whitespace padding: ${match[0].length} consecutive spaces/tabs`,
        severity: "MEDIUM",
        category: PatternCategory.PROMPT_INJECTION,
        file: filename,
        line: i + 1,
        matchedText: `${match[0].length} padding chars`,
        confidence: 0.8,
        explanation: DEFAULT_EXPLANATIONS["P9"],
        remediation: DEFAULT_REMEDIATIONS["P9"],
      });
    }
  }

  return findings;
}

/**
 * SC1: Supply chain unpinned dependencies in requirements.txt.
 */
export function checkSupplyChainDependencies(content: string, fileRel: string): SecurityFinding[] {
  if (!isDependencyManifest(fileRel)) {
    return [];
  }

  const findings: SecurityFinding[] = [];
  const lines = content.split(/\r?\n/);

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim();
    if (!line || line.startsWith("#") || line.startsWith("//")) {
      continue;
    }

    if (fileRel.toLowerCase().includes("requirements")) {
      if (/^[a-zA-Z0-9_-]+(?:\s*>[^=].*|\s*>=.*|\s*)?$/.test(line) && !line.includes("==") && !line.includes("@")) {
        if (!line.startsWith("-")) {
          findings.push({
            ruleId: "SC1",
            message: `Unpinned package dependency: ${line}`,
            severity: "LOW",
            category: PatternCategory.SUPPLY_CHAIN,
            file: fileRel,
            line: idx + 1,
            matchedText: line,
            confidence: 0.7,
            explanation: DEFAULT_EXPLANATIONS["SC1"],
            remediation: DEFAULT_REMEDIATIONS["SC1"],
          });
        }
      }
    }
  }

  return findings;
}

/**
 * DS1-DS4: Language-specific deserialization checks.
 */
export function checkLanguageDeserialization(content: string, fileRel: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const lower = fileRel.toLowerCase();
  const ext = lower.slice(lower.lastIndexOf("."));

  if (ext === ".php" || ext === ".phtml") {
    const regex = /\bunserialize\s*\(/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      findings.push({
        ruleId: "DS1",
        message: "PHP object injection via unserialize()",
        severity: "HIGH",
        category: PatternCategory.DESERIALIZATION,
        file: fileRel,
        line,
        matchedText: m[0],
        confidence: 0.85,
        explanation: DEFAULT_EXPLANATIONS["DS1"],
        remediation: DEFAULT_REMEDIATIONS["DS1"],
      });
    }
  } else if (ext === ".rb" || ext === ".rake") {
    const marshalRegex = /\bMarshal\s*\.\s*(?:load|restore)\b/g;
    let m: RegExpExecArray | null;
    while ((m = marshalRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      findings.push({
        ruleId: "DS2",
        message: "Ruby Marshal deserialization on untrusted data",
        severity: "HIGH",
        category: PatternCategory.DESERIALIZATION,
        file: fileRel,
        line,
        matchedText: m[0],
        confidence: 0.85,
        explanation: DEFAULT_EXPLANATIONS["DS2"],
        remediation: DEFAULT_REMEDIATIONS["DS2"],
      });
    }

    const yamlRegex = /\b(?:YAML|Psych)\s*\.\s*load\s*\(/g;
    while ((m = yamlRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      findings.push({
        ruleId: "DS3",
        message: "Unsafe Ruby YAML.load without safe_load",
        severity: "MEDIUM",
        category: PatternCategory.DESERIALIZATION,
        file: fileRel,
        line,
        matchedText: m[0],
        confidence: 0.75,
        explanation: DEFAULT_EXPLANATIONS["DS3"],
        remediation: DEFAULT_REMEDIATIONS["DS3"],
      });
    }
  } else if ([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"].includes(ext)) {
    const jsDeserRegex = /require\(\s*['"](?:node-serialize|serialize-to-js)['"]\s*\)/g;
    let m: RegExpExecArray | null;
    while ((m = jsDeserRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      findings.push({
        ruleId: "DS4",
        message: "Insecure JavaScript deserialization package",
        severity: "HIGH",
        category: PatternCategory.DESERIALIZATION,
        file: fileRel,
        line,
        matchedText: m[0],
        confidence: 0.85,
        explanation: DEFAULT_EXPLANATIONS["DS4"],
        remediation: DEFAULT_REMEDIATIONS["DS4"],
      });
    }
  }

  return findings;
}

/**
 * AST1-AST10: Behavioral code sinks and dangerous patterns.
 */
export function analyzeBehavioralSinks(
  content: string,
  filename: string,
  isScript: boolean
): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const lower = filename.toLowerCase();
  const isPython =
    lower.endsWith(".py") || (isScript && /^#![^\n]*\bpython(?:[0-9.]*)?\b/.test(content));
  const isJsTs =
    [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"].some((e) => lower.endsWith(e)) ||
    (isScript && /^#![^\n]*\b(?:node|bun|deno)\b/.test(content));

  const lines = content.split(/\r?\n/);
  function getContext(lineNum: number): string {
    const idx = Math.max(0, lineNum - 1);
    const start = Math.max(0, idx - 1);
    const end = Math.min(lines.length, idx + 2);
    return lines.slice(start, end).join("\n");
  }

  if (isPython) {
    // AST1: exec(...)
    const execRegex = /\bexec\s*\(/g;
    let m: RegExpExecArray | null;
    while ((m = execRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      findings.push({
        ruleId: "AST1",
        message: "Direct exec() call",
        severity: "CRITICAL",
        category: PatternCategory.BEHAVIORAL_AST,
        file: filename,
        line,
        matchedText: "exec(...)",
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["AST1"],
        remediation: DEFAULT_REMEDIATIONS["AST1"],
        context: getContext(line),
      });
    }

    // AST2: eval(...)
    const evalRegex = /\beval\s*\(/g;
    while ((m = evalRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      findings.push({
        ruleId: "AST2",
        message: "Direct eval() call",
        severity: "CRITICAL",
        category: PatternCategory.BEHAVIORAL_AST,
        file: filename,
        line,
        matchedText: "eval(...)",
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["AST2"],
        remediation: DEFAULT_REMEDIATIONS["AST2"],
        context: getContext(line),
      });
    }

    // AST3: __import__(...)
    const importRegex = /\b__import__\s*\(/g;
    while ((m = importRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      findings.push({
        ruleId: "AST3",
        message: "Dynamic __import__() call",
        severity: "HIGH",
        category: PatternCategory.BEHAVIORAL_AST,
        file: filename,
        line,
        matchedText: "__import__(...)",
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["AST3"],
        remediation: DEFAULT_REMEDIATIONS["AST3"],
        context: getContext(line),
      });
    }

    // AST6: compile(...)
    const compileRegex = /\bcompile\s*\(/g;
    while ((m = compileRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      findings.push({
        ruleId: "AST6",
        message: "Dynamic compile() call",
        severity: "HIGH",
        category: PatternCategory.BEHAVIORAL_AST,
        file: filename,
        line,
        matchedText: "compile(...)",
        confidence: 0.9,
        explanation: DEFAULT_EXPLANATIONS["AST6"],
        remediation: DEFAULT_REMEDIATIONS["AST6"],
        context: getContext(line),
      });
    }

    // AST5: os.system(...), os.popen(...)
    const osExecRegex = /\bos\s*\.\s*(system|popen)\s*\(/g;
    while ((m = osExecRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      const fn = m[1];
      findings.push({
        ruleId: "AST5",
        message: `Direct os.${fn}() shell execution sink`,
        severity: "HIGH",
        category: PatternCategory.BEHAVIORAL_AST,
        file: filename,
        line,
        matchedText: `os.${fn}(...)`,
        confidence: 0.9,
        explanation: DEFAULT_EXPLANATIONS["AST5"],
        remediation: DEFAULT_REMEDIATIONS["AST5"],
        context: getContext(line),
      });
    }

    // AST4: subprocess.*(..., shell=True)
    const spRegex = /\b(?:subprocess|sp)\s*\.\s*[a-zA-Z0-9_]+\s*\([^)]*shell\s*=\s*True/g;
    while ((m = spRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      findings.push({
        ruleId: "AST4",
        message: "Subprocess call with shell=True",
        severity: "HIGH",
        category: PatternCategory.BEHAVIORAL_AST,
        file: filename,
        line,
        matchedText: "subprocess.*(..., shell=True)",
        confidence: 0.9,
        explanation: DEFAULT_EXPLANATIONS["AST4"],
        remediation: DEFAULT_REMEDIATIONS["AST4"],
        context: getContext(line),
      });
    }

    // AST9: getattr(..., 'exec'|'eval'|'system'|'popen'|'__import__')
    const getattrRegex = /\bgetattr\s*\([^,]+,\s*['"](exec|eval|system|popen|__import__)['"]\s*\)/g;
    while ((m = getattrRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      const target = m[1];
      findings.push({
        ruleId: "AST9",
        message: `Reflective execution handle: getattr(..., '${target}')`,
        severity: "CRITICAL",
        category: PatternCategory.BEHAVIORAL_AST,
        file: filename,
        line,
        matchedText: `getattr(..., '${target}')`,
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["AST9"],
        remediation: DEFAULT_REMEDIATIONS["AST9"],
        context: getContext(line),
      });
    }

    // AST10: Insecure deserialization via pickle, cPickle, dill, marshal
    const pickleRegex = /\b(?:pickle|cPickle|dill|marshal)\s*\.\s*(load|loads)\s*\(/g;
    while ((m = pickleRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      findings.push({
        ruleId: "AST10",
        message: "Insecure deserialization via pickle/marshal/dill",
        severity: "HIGH",
        category: PatternCategory.BEHAVIORAL_AST,
        file: filename,
        line,
        matchedText: m[0],
        confidence: 0.9,
        explanation: DEFAULT_EXPLANATIONS["AST10"],
        remediation: DEFAULT_REMEDIATIONS["AST10"],
        context: getContext(line),
      });
    }

    // AST10: Insecure YAML loading (yaml.unsafe_load or yaml.load without SafeLoader)
    const yamlUnsafeRegex = /\b(?:yaml|ruamel)\s*\.\s*unsafe_load\s*\(/g;
    while ((m = yamlUnsafeRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      findings.push({
        ruleId: "AST10",
        message: "Insecure YAML loading without SafeLoader",
        severity: "HIGH",
        category: PatternCategory.BEHAVIORAL_AST,
        file: filename,
        line,
        matchedText: m[0],
        confidence: 0.85,
        explanation: DEFAULT_EXPLANATIONS["AST10"],
        remediation: DEFAULT_REMEDIATIONS["AST10"],
        context: getContext(line),
      });
    }

    const yamlLoadRegex = /\b(?:yaml|ruamel)\s*\.\s*load\s*\(([^)]*)\)/g;
    while ((m = yamlLoadRegex.exec(content)) !== null) {
      const args = m[1];
      const hasSafeLoader = /Loader\s*=\s*(?:yaml\.)?(?:SafeLoader|CSafeLoader)\b/.test(args) ||
        /,\s*(?:yaml\.)?(?:SafeLoader|CSafeLoader)\b/.test(args);
      if (!hasSafeLoader) {
        const line = content.slice(0, m.index).split("\n").length;
        findings.push({
          ruleId: "AST10",
          message: "Insecure YAML loading without SafeLoader",
          severity: "HIGH",
          category: PatternCategory.BEHAVIORAL_AST,
          file: filename,
          line,
          matchedText: m[0],
          confidence: 0.85,
          explanation: DEFAULT_EXPLANATIONS["AST10"],
          remediation: DEFAULT_REMEDIATIONS["AST10"],
          context: getContext(line),
        });
      }
    }
  }

  if (isJsTs) {
    // JS eval(...)
    const jsEval = /\beval\s*\(/g;
    let m: RegExpExecArray | null;
    while ((m = jsEval.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      findings.push({
        ruleId: "AST2",
        message: "Direct eval() call in JavaScript/TypeScript",
        severity: "CRITICAL",
        category: PatternCategory.BEHAVIORAL_AST,
        file: filename,
        line,
        matchedText: "eval(...)",
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["AST2"],
        remediation: DEFAULT_REMEDIATIONS["AST2"],
        context: getContext(line),
      });
    }

    // JS Function(...)
    const jsFunc = /\b(?:new\s+Function|Function)\s*\(/g;
    while ((m = jsFunc.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      findings.push({
        ruleId: "AST1",
        message: "Dynamic Function constructor execution in JavaScript/TypeScript",
        severity: "CRITICAL",
        category: PatternCategory.BEHAVIORAL_AST,
        file: filename,
        line,
        matchedText: m[0],
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["AST1"],
        remediation: DEFAULT_REMEDIATIONS["AST1"],
        context: getContext(line),
      });
    }

    // child_process exec
    const childProc = /\bchild_process\s*\.\s*(exec|execSync)\s*\(/g;
    while ((m = childProc.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      findings.push({
        ruleId: "AST5",
        message: `Direct child_process.${m[1]}() shell execution sink`,
        severity: "HIGH",
        category: PatternCategory.BEHAVIORAL_AST,
        file: filename,
        line,
        matchedText: m[0],
        confidence: 0.9,
        explanation: DEFAULT_EXPLANATIONS["AST5"],
        remediation: DEFAULT_REMEDIATIONS["AST5"],
        context: getContext(line),
      });
    }
  }

  return findings;
}

/**
 * LP2: MCP Least Privilege wildcard checks on frontmatter.
 */
export function checkLeastPrivilegeFrontmatter(
  manifest: Record<string, unknown> | null | undefined,
  fileName: string
): SecurityFinding[] {
  if (!manifest) return [];
  const findings: SecurityFinding[] = [];
  const allowedTools = manifest["allowed-tools"] || manifest["allowed_tools"];

  if (typeof allowedTools === "string") {
    if (allowedTools.trim() === "*" || allowedTools.trim() === "all") {
      findings.push({
        ruleId: "LP2",
        message: "Wildcard permission '*' grants blanket tool access",
        severity: "HIGH",
        category: PatternCategory.MCP_LEAST_PRIVILEGE,
        file: fileName,
        line: 1,
        matchedText: "wildcard tool permission",
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["LP2"],
        remediation: DEFAULT_REMEDIATIONS["LP2"],
      });
    }
  } else if (Array.isArray(allowedTools)) {
    if (allowedTools.some((t) => t === "*" || t === "all")) {
      findings.push({
        ruleId: "LP2",
        message: "Wildcard permission in allowed-tools list",
        severity: "HIGH",
        category: PatternCategory.MCP_LEAST_PRIVILEGE,
        file: fileName,
        line: 1,
        matchedText: "wildcard tool permission list",
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["LP2"],
        remediation: DEFAULT_REMEDIATIONS["LP2"],
      });
    }
  }

  return findings;
}
