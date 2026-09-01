export type SkillMode =
  | "CREATE"
  | "IMPROVE"
  | "VALIDATE"
  | "EVAL"
  | "OPTIMIZE"
  | "PORT"
  | "PACKAGE"
  | "DISTRIBUTE"
  | "COMPOSE";

export type AgentHost =
  | "claude-code"
  | "antigravity"
  | "codex"
  | "chatgpt"
  | "cursor"
  | "windsurf"
  | "cline"
  | "copilot"
  | "opencode"
  | "universal";

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
export function detectHost(explicitHost?: string): AgentHost {
  if (explicitHost) {
    const norm = explicitHost.toLowerCase().trim();
    if (norm.includes("claude")) return "claude-code";
    if (norm.includes("antigravity") || norm.includes("gemini")) return "antigravity";
    if (norm.includes("codex")) return "codex";
    if (norm.includes("chatgpt")) return "chatgpt";
    if (norm.includes("cursor")) return "cursor";
    if (norm.includes("windsurf")) return "windsurf";
    if (norm.includes("cline") || norm.includes("roo")) return "cline";
    if (norm.includes("copilot")) return "copilot";
    if (norm.includes("opencode")) return "opencode";
    return "universal";
  }

  if (process.env.ANTIGRAVITY || process.env.GEMINI_CLI) return "antigravity";
  if (process.env.CLAUDE_CODE || process.env.CLAUDE_SHELL) return "claude-code";
  if (process.env.CODEX_THREAD_ID || process.env.CODEX) return "codex";
  if (process.env.CURSOR_AGENT) return "cursor";

  return "universal";
}

/**
 * Classify the intent from natural language input.
 */
export function classifyIntent(prompt: string): { intent: SkillMode; confidence: number; targetHosts: AgentHost[]; skillName?: string } {
  const p = prompt.toLowerCase();

  // Extract potential target hosts
  const targetHosts: AgentHost[] = [];
  if (p.includes("claude")) targetHosts.push("claude-code");
  if (p.includes("antigravity") || p.includes("gemini")) targetHosts.push("antigravity");
  if (p.includes("cursor")) targetHosts.push("cursor");
  if (p.includes("codex") || p.includes("chatgpt")) targetHosts.push("codex");
  if (p.includes("windsurf")) targetHosts.push("windsurf");
  if (p.includes("cline") || p.includes("roo")) targetHosts.push("cline");
  if (p.includes("copilot")) targetHosts.push("copilot");
  if (targetHosts.length === 0) targetHosts.push("universal");

  // Extract skill name if named
  const nameMatch = prompt.match(/(?:skill|package|repo|for|named)\s+["'`]?([a-zA-Z0-9_-]+)["'`]?/i);
  const skillName = nameMatch ? nameMatch[1] : undefined;

  // 1. Distribution & Repo Crafting
  if (
    p.includes("distribute") ||
    p.includes("publish") ||
    p.includes("repo") ||
    p.includes("github") ||
    p.includes("skills.sh") ||
    p.includes("marketplace") ||
    p.includes("انشر") ||
    p.includes("مستودع") ||
    p.includes("توزيع")
  ) {
    return { intent: "DISTRIBUTE", confidence: 0.95, targetHosts, skillName };
  }

  // 2. Packaging
  if (
    p.includes("package") ||
    p.includes(".skill") ||
    p.includes("bundle") ||
    p.includes("حزمة") ||
    p.includes("تجميع")
  ) {
    return { intent: "PACKAGE", confidence: 0.9, targetHosts, skillName };
  }

  // 3. Porting / Cross-Host Adapter
  if (
    p.includes("port") ||
    p.includes("adapt") ||
    p.includes("convert to") ||
    p.includes("convert to cursor") ||
    p.includes("convert to claude") ||
    p.includes("convert to codex") ||
    p.includes("تحويل") ||
    p.includes("حول") ||
    p.includes("حوّل") ||
    p.includes("نقل") ||
    p.includes("انقل") ||
    p.includes("تكييف")
  ) {
    return { intent: "PORT", confidence: 0.92, targetHosts, skillName };
  }

  // 4. Trigger Optimization
  if (
    p.includes("optimize description") ||
    p.includes("trigger better") ||
    p.includes("doesn't trigger") ||
    p.includes("overtrigger") ||
    p.includes("undertrigger") ||
    p.includes("تحسين التفعيل") ||
    p.includes("لا يعمل التفعيل")
  ) {
    return { intent: "OPTIMIZE", confidence: 0.9, targetHosts, skillName };
  }

  // 5. Evaluation & Testing
  if (
    p.includes("eval") ||
    p.includes("bineval") ||
    p.includes("benchmark") ||
    p.includes("test skill") ||
    p.includes("assertion") ||
    p.includes("اختبار") ||
    p.includes("تقييم")
  ) {
    return { intent: "EVAL", confidence: 0.9, targetHosts, skillName };
  }

  // 6. Validation & Quality Check
  if (
    p.includes("validate") ||
    p.includes("lint") ||
    p.includes("check structure") ||
    p.includes("frontmatter check") ||
    p.includes("فحص") ||
    p.includes("تحقق")
  ) {
    return { intent: "VALIDATE", confidence: 0.88, targetHosts, skillName };
  }

  // 7. Improvement & Bug Fix
  if (
    p.includes("improve") ||
    p.includes("fix") ||
    p.includes("repair") ||
    p.includes("refactor") ||
    p.includes("update skill") ||
    p.includes("صلح") ||
    p.includes("عدل") ||
    p.includes("طور")
  ) {
    return { intent: "IMPROVE", confidence: 0.85, targetHosts, skillName };
  }

  // 8. Creation / New Skill (Default if generative intent)
  return { intent: "CREATE", confidence: 0.8, targetHosts, skillName };
}

/**
 * Generate a dynamic Directed Acyclic Graph (DAG) for the given intent and targets.
 */
export function buildExecutionDag(
  intent: SkillMode,
  skillName: string = "target-skill",
  targetHosts: AgentHost[] = ["universal"]
): RouteStep[] {
  switch (intent) {
    case "CREATE":
      return [
        {
          id: "step-1-architect",
          skill: "skill-architect",
          mode: "CREATE",
          purpose: "Design SkillSpec, capture user intent, define freedom calibration, and isolate failure baseline",
          requiredReferences: ["references/skill-spec.md", "references/sop-practices.md"],
          freedomLevel: "low"
        },
        {
          id: "step-2-scaffold",
          skill: "host-workspace-operator",
          mode: "CREATE",
          purpose: "Scaffold directory structure, SKILL.md, references/, and deterministic scripts",
          dependsOn: ["step-1-architect"],
          requiredReferences: ["references/runtime-setup.md"],
          recommendedCommand: `omni-skill init ${skillName}`,
          freedomLevel: "low"
        },
        {
          id: "step-3-evals",
          skill: "skill-evaluator",
          mode: "EVAL",
          purpose: "Generate trigger eval bank, BinEval assertions, and held-out 70/30 test splits",
          dependsOn: ["step-2-scaffold"],
          requiredReferences: ["references/bineval-method.md", "references/quality-questions.md"],
          freedomLevel: "medium"
        },
        {
          id: "step-4-validate-score",
          skill: "skill-conductor",
          mode: "VALIDATE",
          purpose: "Run structural validation (eval_skill.py) and achieve 10/10 clean score",
          dependsOn: ["step-3-evals"],
          requiredReferences: ["references/runtime-setup.md"],
          recommendedCommand: `omni-skill validate ${skillName}`,
          recoveryStep: "step-1-architect",
          freedomLevel: "low"
        }
      ];

    case "DISTRIBUTE":
      return [
        {
          id: "step-1-validate",
          skill: "skill-conductor",
          mode: "VALIDATE",
          purpose: "Verify skill adheres to Skill Conductor canon and passes eval_skill.py with 10/10",
          requiredReferences: ["references/sop-practices.md"],
          recommendedCommand: `omni-skill validate ${skillName}`,
          freedomLevel: "low"
        },
        {
          id: "step-2-scaffold-distribution",
          skill: "repo-craft-and-distribute",
          mode: "DISTRIBUTE",
          purpose: "Generate package.json, marketplace.json, .skills.json, install.sh, and GitHub Actions CI",
          dependsOn: ["step-1-validate"],
          requiredReferences: ["references/multi-agent-manifests.md", "references/readme-standards.md"],
          recommendedCommand: `bun skills/repo-craft-and-distribute/scripts/scaffold-repo.ts ./${skillName} --name "${skillName}"`,
          freedomLevel: "low"
        },
        {
          id: "step-3-publish-github",
          skill: "repo-craft-and-distribute",
          mode: "DISTRIBUTE",
          purpose: "Initialize git, create public repository via gh CLI, tag discovery topics, and verify Mermaid rendering",
          dependsOn: ["step-2-scaffold-distribution"],
          requiredReferences: ["references/github-workflow-and-metadata.md", "references/distribution-channels.md"],
          freedomLevel: "medium"
        }
      ];

    case "PORT":
      return [
        {
          id: "step-1-inspect",
          skill: "host-workspace-operator",
          mode: "VALIDATE",
          purpose: "Inspect source SKILL.md, references, and dependencies",
          requiredReferences: ["references/host-profiles.md"],
          freedomLevel: "low"
        },
        {
          id: "step-2-compile-adapter",
          skill: "skill-portability-compiler",
          mode: "PORT",
          purpose: `Compile native manifests and directives for targets: ${targetHosts.join(", ")}`,
          dependsOn: ["step-1-inspect"],
          requiredReferences: ["references/cross-host-evaluation.md"],
          recommendedCommand: `omni-skill port ${skillName} --target ${targetHosts[0] || "claude"}`,
          freedomLevel: "low"
        },
        {
          id: "step-3-verify-port",
          skill: "skill-evaluator",
          mode: "EVAL",
          purpose: "Verify ported artifacts against host capability contracts and emit gap report",
          dependsOn: ["step-2-compile-adapter"],
          requiredReferences: ["references/bineval-method.md"],
          freedomLevel: "low"
        }
      ];

    case "OPTIMIZE":
      return [
        {
          id: "step-1-eval-baseline",
          skill: "skill-evaluator",
          mode: "EVAL",
          purpose: "Run trigger bank against current description to compute baseline trigger/collision scores",
          requiredReferences: ["references/bineval-method.md"],
          freedomLevel: "low"
        },
        {
          id: "step-2-optimize-loop",
          skill: "skill-conductor",
          mode: "OPTIMIZE",
          purpose: "Run train/test split optimization loop with canonical description formula and negative triggers",
          dependsOn: ["step-1-eval-baseline"],
          requiredReferences: ["references/sop-practices.md"],
          recommendedCommand: `uv run scripts/run_loop.py ${skillName}`,
          freedomLevel: "low"
        }
      ];

    case "IMPROVE":
      return [
        {
          id: "step-1-diagnose",
          skill: "skill-conductor",
          mode: "REVIEW",
          purpose: "Isolate failure symptoms, undertriggering, and missing invariants against failure baseline",
          requiredReferences: ["references/pressure-testing.md", "references/sop-practices.md"],
          freedomLevel: "low"
        },
        {
          id: "step-2-apply-edits",
          skill: "host-workspace-operator",
          mode: "IMPROVE",
          purpose: "Apply minimal surgical edits to SKILL.md and references without bloating context",
          dependsOn: ["step-1-diagnose"],
          requiredReferences: ["references/patterns.md"],
          freedomLevel: "low"
        },
        {
          id: "step-3-revalidate",
          skill: "skill-evaluator",
          mode: "EVAL",
          purpose: "Run BinEval assertions to verify regression-free improvement",
          dependsOn: ["step-2-apply-edits"],
          requiredReferences: ["references/bineval-method.md"],
          recommendedCommand: `omni-skill eval ${skillName}`,
          recoveryStep: "step-1-diagnose",
          freedomLevel: "low"
        }
      ];

    case "EVAL":
    case "VALIDATE":
      return [
        {
          id: "step-1-validate",
          skill: "skill-conductor",
          mode: "VALIDATE",
          purpose: "Run 10-point structural validation and security audit",
          requiredReferences: ["references/schemas.md"],
          recommendedCommand: `omni-skill validate ${skillName}`,
          freedomLevel: "low"
        },
        {
          id: "step-2-eval-assertions",
          skill: "skill-evaluator",
          mode: "EVAL",
          purpose: "Run BinEval assertions and trigger collision testing",
          dependsOn: ["step-1-validate"],
          requiredReferences: ["references/bineval-method.md"],
          recommendedCommand: `omni-skill eval ${skillName}`,
          freedomLevel: "low"
        }
      ];

    case "PACKAGE":
      return [
        {
          id: "step-1-validate",
          skill: "skill-conductor",
          mode: "VALIDATE",
          purpose: "Pre-packaging quality validation",
          requiredReferences: ["references/schemas.md"],
          recommendedCommand: `omni-skill validate ${skillName}`,
          freedomLevel: "low"
        },
        {
          id: "step-2-bundle",
          skill: "skill-conductor",
          mode: "PACKAGE",
          purpose: "Package verified skill into standalone .skill archive and host plugins",
          dependsOn: ["step-1-validate"],
          requiredReferences: ["references/runtime-setup.md"],
          recommendedCommand: `omni-skill package ${skillName}`,
          freedomLevel: "low"
        }
      ];

    default:
      return [
        {
          id: "step-1-orchestrate",
          skill: "omni-skill",
          mode: "CREATE",
          purpose: "Default lifecycle orchestration",
          requiredReferences: ["references/skill-spec.md"],
          freedomLevel: "medium"
        }
      ];
  }
}

/**
 * Main Smart Router Function
 */
export function routeRequest(prompt: string, explicitHost?: string): RouteResult {
  const host = detectHost(explicitHost);
  const { intent, confidence, targetHosts, skillName } = classifyIntent(prompt);
  const actualSkillName = skillName || "skill-artifact";
  const dag = buildExecutionDag(intent, actualSkillName, targetHosts);

  // Aggregate all unique required references
  const allRefs = new Set<string>();
  dag.forEach(step => step.requiredReferences.forEach(ref => allRefs.add(ref)));

  return {
    intent,
    confidence,
    detectedHost: host,
    targetHosts,
    skillName: actualSkillName,
    dag,
    contextBudget: {
      maxTokens: 2500,
      recommendedFiles: Array.from(allRefs)
    },
    explanation: `Classified as '${intent}' (${Math.round(confidence * 100)}% confidence). Generated a ${dag.length}-step execution DAG targeting [${targetHosts.join(", ")}] on host '${host}'.`
  };
}
