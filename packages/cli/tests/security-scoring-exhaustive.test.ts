import { describe, expect, it } from "bun:test";
import { computeRiskScore, SecurityFinding } from "../src/core/security";

describe("Risk Assessment Engine - Exhaustive Scoring Verification", () => {
  it("applies diminishing returns per rule: 100%, 50%, 25%, and 0% for 4th match", () => {
    // Medium finding = 10 base points
    const finding = (i: number): SecurityFinding => ({
      ruleId: "TEST_DIM",
      message: "msg",
      severity: "MEDIUM",
      category: "Test",
      file: "doc.md",
      line: i,
      matchedText: "match",
      confidence: 1.0,
    });

    const score1 = computeRiskScore([finding(1)]);
    expect(score1.riskScore).toBe(10); // 10 * 1.0 = 10

    const score2 = computeRiskScore([finding(1), finding(2)]);
    expect(score2.riskScore).toBe(15); // 10 + 10*0.5 = 15

    const score3 = computeRiskScore([finding(1), finding(2), finding(3)]);
    expect(score3.riskScore).toBe(17); // 10 + 5 + 10*0.25 = 17.5 -> floor = 17

    const score4 = computeRiskScore([finding(1), finding(2), finding(3), finding(4)]);
    expect(score4.riskScore).toBe(17); // 4th match contributes 0
  });

  it("applies confidence scaling proportionally to base points", () => {
    const finding: SecurityFinding = {
      ruleId: "CONF_TEST",
      message: "msg",
      severity: "HIGH", // 25 base points
      category: "Test",
      file: "doc.md",
      line: 1,
      matchedText: "match",
      confidence: 0.5,
    };
    const evalResult = computeRiskScore([finding]);
    expect(evalResult.riskScore).toBe(12); // 25 * 1.0 * 0.5 = 12.5 -> floor = 12
  });

  it("applies 1.3x multiplier to findings originating from executable scripts", () => {
    const finding: SecurityFinding = {
      ruleId: "SCRIPT_MULT",
      message: "msg",
      severity: "MEDIUM", // 10 base points
      category: "Test",
      file: "scripts/run.sh",
      line: 1,
      matchedText: "match",
      confidence: 1.0,
    };
    const evalNonScript = computeRiskScore([finding], false, new Set());
    expect(evalNonScript.riskScore).toBe(10);

    const evalScript = computeRiskScore([finding], true, new Set(["scripts/run.sh"]));
    expect(evalScript.riskScore).toBe(13); // 10 * 1.3 = 13
  });

  it("enforces floor >= 51 for critical findings and specific high-risk rules", () => {
    const critFinding: SecurityFinding = {
      ruleId: "RANDOM_CRIT",
      message: "msg",
      severity: "CRITICAL",
      category: "Test",
      file: "doc.md",
      line: 1,
      matchedText: "match",
      confidence: 0.8,
    };
    expect(computeRiskScore([critFinding]).riskScore).toBeGreaterThanOrEqual(51);

    const tm1Finding: SecurityFinding = {
      ruleId: "TM1",
      message: "msg",
      severity: "CRITICAL",
      category: "Tool Misuse",
      file: "clean.sh",
      line: 1,
      matchedText: "match",
      confidence: 0.5,
    };
    expect(computeRiskScore([tm1Finding]).riskScore).toBeGreaterThanOrEqual(51);
  });

  it("evaluates severity bands and recommendations accurately", () => {
    // Score <= 20 -> LOW, APPROVE
    const low = computeRiskScore([
      {
        ruleId: "LOW_1",
        message: "m",
        severity: "LOW",
        category: "c",
        file: "f",
        line: 1,
        matchedText: "x",
        confidence: 1.0,
      },
    ]);
    expect(low.severity).toBe("LOW");
    expect(low.recommendation).toBe("APPROVE");

    // 10 low findings with distinct rule IDs: 10 * 5 = 50 -> HIGH, REJECT
    const findings50 = Array.from({ length: 10 }, (_, i) => ({
      ruleId: `LOW_${i}`,
      message: "m",
      severity: "LOW" as const,
      category: "c",
      file: "f",
      line: i,
      matchedText: "x",
      confidence: 1.0,
    }));
    const score50 = computeRiskScore(findings50);
    expect(score50.riskScore).toBe(50);
    expect(score50.severity).toBe("HIGH");
    expect(score50.recommendation).toBe("REJECT");
  });
});
