import { PatternCategory, SecuritySeverity } from "./security-types";
export interface PatternRule {
    ruleId: string;
    name: string;
    severity: SecuritySeverity;
    category: PatternCategory;
    patterns: Array<{
        regex: string;
        confidence: number;
    }>;
}
export declare const PATTERNS_DATABASE: PatternRule[];
