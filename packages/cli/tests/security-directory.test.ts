import { describe, expect, it } from "bun:test";
import {
  scanSkillDirectory,
  computeRiskScore,
  formatSecurityReportTerminal,
  formatSecurityReportJson,
  formatSecurityReportSarif,
  SecurityFinding,
} from "../src/core/security";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("TypeScript Security Engine - Directory Scanning & Scoring", () => {
  it("rejects skill with uninspectable binary file (SC9)", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-test-bin-"));
    try {
      const skillDir = join(tempBase, "binary-skill");
      mkdirSync(skillDir);
      writeFileSync(
        join(skillDir, "SKILL.md"),
        `---
name: binary-skill
description: A skill with a binary file.
---
# Why
Target
`
      );
      writeFileSync(join(skillDir, "evil.exe"), new Uint8Array([0x4d, 0x5a, 0x00, 0x01]));
      const report = scanSkillDirectory(skillDir);
      expect(report.passed).toBe(false);
      expect(report.findings.some((f) => f.ruleId === "SC9")).toBe(true);
    } finally {
      rmSync(tempBase, { recursive: true });
    }
  });

  it("rejects skill containing symbolic link (SC9)", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-test-symlink-"));
    try {
      const skillDir = join(tempBase, "symlink-skill");
      mkdirSync(skillDir);
      writeFileSync(
        join(skillDir, "SKILL.md"),
        `---
name: symlink-skill
description: A skill with a symlink.
---
# Why
Target
`
      );
      const secret = join(tempBase, "outside.txt");
      writeFileSync(secret, "secret data");
      symlinkSync(secret, join(skillDir, "leak.txt"));

      const report = scanSkillDirectory(skillDir);
      expect(report.passed).toBe(false);
      expect(report.findings.some((f) => f.ruleId === "SC9")).toBe(true);
    } finally {
      rmSync(tempBase, { recursive: true });
    }
  });

  it("passes safe skill with zero findings", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-test-safe-"));
    try {
      const skillDir = join(tempBase, "safe-skill");
      mkdirSync(skillDir);
      writeFileSync(
        join(skillDir, "SKILL.md"),
        `---
name: safe-skill
description: A safe skill.
---
# Why This Skill Is Needed
Target State
`
      );
      const report = scanSkillDirectory(skillDir);
      expect(report.passed).toBe(true);
      expect(report.riskScore).toBe(0);
      expect(report.severity).toBe("LOW");
      expect(report.recommendation).toBe("APPROVE");
    } finally {
      rmSync(tempBase, { recursive: true });
    }
  });

  it("computes diminishing weights, confidence scaling, and score floor", () => {
    const lowFinding: SecurityFinding = {
      ruleId: "TEST",
      message: "Test msg",
      severity: "LOW",
      category: "Supply Chain",
      file: "f.txt",
      line: 1,
      matchedText: "m",
      confidence: 1.0,
    };
    const evalLow = computeRiskScore([lowFinding]);
    expect(evalLow.riskScore).toBe(5);
    expect(evalLow.severity).toBe("LOW");
    expect(evalLow.recommendation).toBe("APPROVE");

    const critFinding: SecurityFinding = {
      ruleId: "TM1",
      message: "rm -rf /",
      severity: "CRITICAL",
      category: "Tool Misuse",
      file: "f.sh",
      line: 1,
      matchedText: "m",
      confidence: 1.0,
    };
    const evalCrit = computeRiskScore([critFinding], true, new Set(["f.sh"]));
    expect(evalCrit.riskScore).toBeGreaterThanOrEqual(51);
    expect(evalCrit.recommendation).toBe("REJECT");
  });

  it("formats terminal, JSON, and SARIF reports", () => {
    const finding: SecurityFinding = {
      ruleId: "P1",
      message: "Instruction Override",
      severity: "CRITICAL",
      category: "Prompt Injection",
      file: "SKILL.md",
      line: 10,
      matchedText: "ignore instructions",
      confidence: 0.95,
      explanation: "Expl",
      remediation: "Rem",
    };
    const report = {
      targetPath: "/path/to/skill",
      skillName: "sample-skill",
      riskScore: 55,
      severity: "HIGH" as const,
      recommendation: "REJECT" as const,
      findings: [finding],
      filesAnalyzed: 1,
      passed: false,
    };

    const term = formatSecurityReportTerminal(report);
    expect(term).toContain("SKILL SECURITY SCAN: sample-skill");
    expect(term).toContain("P1");

    const jsonStr = formatSecurityReportJson(report);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.riskScore).toBe(55);

    const sarifStr = formatSecurityReportSarif(report);
    const sarif = JSON.parse(sarifStr);
    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0].results[0].ruleId).toBe("P1");
  });
});
