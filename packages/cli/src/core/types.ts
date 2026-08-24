export interface SkillFrontmatter {
  name: string;
  description: string;
  version?: string;
  author?: string;
}

export interface SkillManifest {
  name: string;
  frontmatter: SkillFrontmatter;
  content: string;
  lineCount: number;
  hasReferences: boolean;
  hasScripts: boolean;
  hasEvals: boolean;
}

export interface ValidationFinding {
  severity: "error" | "warning";
  code: string;
  message: string;
}

export interface ValidationResult {
  skill: string;
  targets: string[];
  errors: number;
  warnings: number;
  findings: ValidationFinding[];
  pass: boolean;
}

export interface OmniSkillSpec {
  name: string;
  description: string;
  job: string;
  target_hosts?: string[];
  freedom_level?: "high" | "medium" | "low";
  instructions: string[];
  references?: Record<string, string>;
  evals?: Array<{
    id: string;
    description?: string;
    assertions: Array<{ pattern: string; required?: boolean }>;
  }>;
}
