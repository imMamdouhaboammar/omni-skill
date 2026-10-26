export interface EvalCommandOptions {
    candidate?: string;
    responses?: string;
    json?: boolean;
}
export interface EvalAssertion {
    pattern: string;
    required?: boolean;
}
export interface EvalCase {
    id: string;
    prompt?: string;
    assertions: EvalAssertion[];
}
export interface EvalCaseResult {
    id: string;
    status: "PASSED" | "FAILED" | "UNVERIFIED" | "ERROR";
    passed: boolean;
    message?: string;
    failingPattern?: string;
}
export interface EvalRunSummary {
    status: "PASS" | "FAIL" | "UNVERIFIED" | "INVALID_SUITE" | "ERROR";
    total: number;
    passed: number;
    failed: number;
    unverified: number;
    errors: number;
    pass_rate: number;
    results: EvalCaseResult[];
    error?: string;
}
export declare function evalSkillCommand(skillPathArg: string, options?: EvalCommandOptions): EvalRunSummary;
