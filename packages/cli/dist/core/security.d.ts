/**
 * Deterministic Pure-TypeScript Agent Skill Security Scanner
 * Reverse-Engineered from SkillSpector architecture (matching scan_skill_security.py).
 */
import { SecurityFinding, SecurityScanReport } from "./security-types";
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
export declare function parseSkillFrontmatter(content: string): Record<string, unknown> | null;
/**
 * Scans arbitrary text content across all pattern categories.
 */
export declare function scanSkillText(content: string, fileRel: string, options?: {
    isScript?: boolean;
    skillManifest?: Record<string, unknown> | null;
}): SecurityFinding[];
/**
 * Scans a skill directory completely, applying all security gates.
 */
export declare function scanSkillDirectory(skillDirArg: string): SecurityScanReport;
/**
 * Formats a scan report for terminal output.
 */
export declare function formatSecurityReportTerminal(report: SecurityScanReport): string;
/**
 * Formats a scan report as JSON string.
 */
export declare function formatSecurityReportJson(report: SecurityScanReport): string;
/**
 * Formats a scan report as SARIF 2.1.0 string for GitHub code scanning integration.
 */
export declare function formatSecurityReportSarif(report: SecurityScanReport): string;
