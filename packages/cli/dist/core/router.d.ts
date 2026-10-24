export type SkillMode = "CREATE" | "IMPROVE" | "VALIDATE" | "EVAL" | "OPTIMIZE" | "PORT" | "PACKAGE" | "DISTRIBUTE" | "COMPOSE" | "MEASURE" | "INTEGRATE" | "PRINCIPLES" | "AUTHOR";
export type AgentHost = "claude-code" | "antigravity" | "codex" | "chatgpt" | "cursor" | "windsurf" | "cline" | "copilot" | "opencode" | "universal";
export interface RouteStep {
    id: string;
    skill: string;
    mode: SkillMode;
    purpose: string;
    dependsOn?: string[];
    requiredReferences: string[];
    requiredScripts?: string[];
    recommendedCommand?: string;
    freedomLevel?: "low" | "medium" | "high";
    recoveryStep?: string;
}
export interface RouteResult {
    intent: SkillMode;
    confidence: number;
    detectedHost: AgentHost;
    targetHosts: AgentHost[];
    skillName?: string;
    dag: RouteStep[];
    contextBudget: {
        maxTokens: number;
        recommendedFiles: string[];
    };
    explanation: string;
}
/**
 * Detect the host environment based on environment variables or explicit hint.
 */
export declare function detectHost(explicitHost?: string): AgentHost;
/**
 * Classify the intent from natural language input.
 */
export declare function classifyIntent(prompt: string): {
    intent: SkillMode;
    confidence: number;
    targetHosts: AgentHost[];
    skillName?: string;
};
/**
 * Generate a dynamic Directed Acyclic Graph (DAG) for the given intent and targets.
 */
export declare function buildExecutionDag(intent: SkillMode, skillName?: string, targetHosts?: AgentHost[]): RouteStep[];
/**
 * Main Smart Router Function
 */
export declare function routeRequest(prompt: string, explicitHost?: string): RouteResult;
