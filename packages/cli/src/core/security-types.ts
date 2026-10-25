/**
 * Agent Skill Security Scanner Types and Enums
 * Deterministic static security model matching SkillSpector architecture.
 */

export type SecuritySeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export enum PatternCategory {
  PROMPT_INJECTION = "Prompt Injection",
  DATA_EXFILTRATION = "Data Exfiltration",
  PRIVILEGE_ESCALATION = "Privilege Escalation",
  SUPPLY_CHAIN = "Supply Chain",
  EXCESSIVE_AGENCY = "Excessive Agency",
  OUTPUT_HANDLING = "Output Handling",
  SYSTEM_PROMPT_LEAKAGE = "System Prompt Leakage",
  MEMORY_POISONING = "Memory Poisoning",
  TOOL_MISUSE = "Tool Misuse",
  ROGUE_AGENT = "Rogue Agent",
  TRIGGER_ABUSE = "Trigger Abuse",
  MCP_LEAST_PRIVILEGE = "MCP Least Privilege",
  MCP_TOOL_POISONING = "MCP Tool Poisoning",
  AGENT_SNOOPING = "Agent Snooping",
  ANTI_REFUSAL = "Anti-Refusal",
  SERVER_SIDE_REQUEST_FORGERY = "Server-Side Request Forgery",
  DESERIALIZATION = "Insecure Deserialization",
  BEHAVIORAL_AST = "Behavioral AST",
}

export interface SecurityFinding {
  ruleId: string;
  message: string;
  severity: SecuritySeverity;
  category: PatternCategory | string;
  file: string;
  line: number;
  matchedText: string;
  confidence: number;
  explanation?: string;
  remediation?: string;
  context?: string;
}

export interface SecurityScanReport {
  targetPath: string;
  skillName: string;
  riskScore: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  recommendation: "APPROVE" | "CAUTION" | "REJECT";
  findings: SecurityFinding[];
  filesAnalyzed: number;
  passed: boolean;
}
