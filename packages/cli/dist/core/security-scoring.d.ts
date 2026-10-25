/**
 * Risk Assessment and Scoring Engine
 * Reconstructed deterministically from SkillSpector report.py.
 */
import { SecurityFinding, SecuritySeverity } from "./security-types";
export declare const SEVERITY_POINTS: Record<SecuritySeverity, number>;
export declare const DIMINISHING_WEIGHTS: number[];
export declare const MAX_OCCURRENCES_PER_RULE: number;
export declare const RISK_THRESHOLD = 50;
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
export declare function computeRiskScore(findings: SecurityFinding[], hasExecutableScripts?: boolean, scriptFiles?: Set<string>): RiskEvaluation;
