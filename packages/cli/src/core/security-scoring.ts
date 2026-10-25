/**
 * Risk Assessment and Scoring Engine
 * Reconstructed deterministically from SkillSpector report.py.
 */

import { SecurityFinding, SecuritySeverity } from "./security-types";

export const SEVERITY_POINTS: Record<SecuritySeverity, number> = {
  CRITICAL: 50,
  HIGH: 25,
  MEDIUM: 10,
  LOW: 5,
  INFO: 0,
};

export const DIMINISHING_WEIGHTS = [1.0, 0.5, 0.25];
export const MAX_OCCURRENCES_PER_RULE = DIMINISHING_WEIGHTS.length;
export const RISK_THRESHOLD = 50;

const SEVERITY_RANK: Record<SecuritySeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

export interface RiskEvaluation {
  riskScore: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  recommendation: "APPROVE" | "CAUTION" | "REJECT";
}

/**
 * Computes risk score (0-100), severity band, and recommendation.
 *
 * - Diminishing returns per rule_id: 1st match = 100%, 2nd = 50%, 3rd = 25%, 4th+ = 0%.
 * - Confidence scaling: contribution = base_points * weight * confidence.
 * - Script multiplier: 1.3x multiplier for findings originating from executable scripts.
 * - Floor rule: Critical findings floor score at >= 51.
 */
export function computeRiskScore(
  findings: SecurityFinding[],
  hasExecutableScripts: boolean = false,
  scriptFiles: Set<string> = new Set()
): RiskEvaluation {
  const sortedFindings = [...findings].sort((a, b) => {
    if (a.ruleId !== b.ruleId) {
      return a.ruleId.localeCompare(b.ruleId);
    }
    const rankA = SEVERITY_RANK[a.severity] ?? 4;
    const rankB = SEVERITY_RANK[b.severity] ?? 4;
    return rankA - rankB;
  });

  const ruleCounts = new Map<string, number>();
  let totalScore = 0.0;

  for (const f of sortedFindings) {
    const rawConf = typeof f.confidence === "number" ? f.confidence : 1.0;
    const conf = Math.max(0.0, Math.min(1.0, rawConf));
    if (conf <= 0.0) continue;

    const basePoints = SEVERITY_POINTS[f.severity] ?? 5;
    const count = ruleCounts.get(f.ruleId) ?? 0;
    ruleCounts.set(f.ruleId, count + 1);

    if (count >= MAX_OCCURRENCES_PER_RULE) {
      continue;
    }

    const weight = DIMINISHING_WEIGHTS[count];
    let contribution = basePoints * weight * conf;

    // 1.3x multiplier for findings in executable scripts
    if (hasExecutableScripts && scriptFiles.has(f.file)) {
      contribution *= 1.3;
    }

    totalScore += contribution;
  }

  // Score floor logic
  let scoreFloor = 0;
  for (const f of sortedFindings) {
    const conf = typeof f.confidence === "number" ? f.confidence : 1.0;
    if (f.severity === "CRITICAL" && conf >= 0.7) {
      scoreFloor = Math.max(scoreFloor, 51);
    } else if (["TM1", "SC2", "AR3", "SSRF1"].includes(f.ruleId)) {
      scoreFloor = Math.max(scoreFloor, 51);
    }
  }

  const finalScore = Math.min(100, Math.max(scoreFloor, Math.floor(totalScore)));

  // Severity band and recommendation
  let severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  let recommendation: "APPROVE" | "CAUTION" | "REJECT";

  if (finalScore <= 20) {
    severity = "LOW";
    recommendation = "APPROVE";
  } else if (finalScore < RISK_THRESHOLD) {
    severity = "MEDIUM";
    recommendation = "CAUTION";
  } else if (finalScore <= 75) {
    severity = "HIGH";
    recommendation = "REJECT";
  } else {
    severity = "CRITICAL";
    recommendation = "REJECT";
  }

  return {
    riskScore: finalScore,
    severity,
    recommendation,
  };
}
