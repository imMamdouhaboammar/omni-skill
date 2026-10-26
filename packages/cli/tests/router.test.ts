import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { classifyIntent, detectHost, buildExecutionDag, routeRequest } from "../src/core/router";

describe("OmniSkill Dynamic Agentic Router", () => {
  const hostKeys = ["ANTIGRAVITY", "GEMINI_CLI", "CLAUDE_CODE", "CLAUDE_SHELL", "CODEX_THREAD_ID", "CODEX", "CURSOR_AGENT"];
  let saved: Record<string, string | undefined>;
  beforeEach(() => {
    saved = Object.fromEntries(hostKeys.map(k => [k, process.env[k]]));
    hostKeys.forEach(k => delete process.env[k]);
  });
  afterEach(() => hostKeys.forEach(k => {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }));
  it("should detect host from explicit option or environment", () => {
    expect(detectHost("claude")).toBe("claude-code");
    expect(detectHost("antigravity")).toBe("antigravity");
    expect(detectHost("cursor")).toBe("cursor");
    expect(detectHost("codex")).toBe("codex");
    expect(detectHost("windsurf")).toBe("windsurf");
    expect(detectHost()).toBe("universal");
  });

  it("should classify natural language intents accurately", () => {
    // Creation
    expect(classifyIntent("Build a new skill for SQL optimization").intent).toBe("CREATE");
    
    // Improvement
    expect(classifyIntent("Fix bug in this skill and improve reliability").intent).toBe("IMPROVE");
    
    // Evaluation
    expect(classifyIntent("Run BinEval assertions and benchmark score").intent).toBe("EVAL");
    
    // Validation
    expect(classifyIntent("Validate skill structure and security lint").intent).toBe("VALIDATE");
    
    // Optimization
    expect(classifyIntent("Optimize description to trigger better").intent).toBe("OPTIMIZE");
    
    // Porting
    expect(classifyIntent("Port skill to Cursor and Claude Code").intent).toBe("PORT");
    
    // Packaging
    expect(classifyIntent("Package skill into .skill archive bundle").intent).toBe("PACKAGE");
    
    // Distribution
    expect(classifyIntent("Craft repo and distribute to GitHub and skills.sh").intent).toBe("DISTRIBUTE");

    // Measure / Empirical Hypothesis
    expect(classifyIntent("Measure latency and benchmark throughput before optimization").intent).toBe("MEASURE");

    // Integrate / Migration Protocol
    expect(classifyIntent("Integrate drizzle orm and migrate legacy queries").intent).toBe("INTEGRATE");

    // Poteto Engineering Principles
    expect(classifyIntent("Audit code against poteto principles and boundary discipline").intent).toBe("PRINCIPLES");

    // Skill Authoring
    expect(classifyIntent("Author skill for data pipeline orchestration").intent).toBe("AUTHOR");
  });

  it("should classify Arabic natural language intents", () => {
    expect(classifyIntent("انشر المهارة دي على github ووزعها").intent).toBe("DISTRIBUTE");
    expect(classifyIntent("صلح المشكلة دي في المهارة").intent).toBe("IMPROVE");
    expect(classifyIntent("اختبر المهارة واعمل evals").intent).toBe("EVAL");
    expect(classifyIntent("حول المهارة دي ل cursor").intent).toBe("PORT");
    expect(classifyIntent("احسب السرعة وقيس latency").intent).toBe("MEASURE");
    expect(classifyIntent("دمج المكتبة الجديدة وترحيل الكود القديم").intent).toBe("INTEGRATE");
    expect(classifyIntent("راجع المبادئ الهندسية").intent).toBe("PRINCIPLES");
    expect(classifyIntent("تأليف مهارة جديدة").intent).toBe("AUTHOR");
  });

  it("should extract target hosts from prompt", () => {
    const res = classifyIntent("Port this skill to Cursor and Claude Code");
    expect(res.targetHosts).toContain("cursor");
    expect(res.targetHosts).toContain("claude-code");
  });

  it("should construct a valid DAG with non-empty steps and references", () => {
    const dag = buildExecutionDag("CREATE", "sql-optimizer", ["claude-code"]);
    expect(dag.length).toBeGreaterThanOrEqual(3);
    expect(dag[0]?.skill).toBe("skill-architect");
    expect(dag[1]?.dependsOn).toContain("step-1-architect");
    expect(dag[0]?.requiredReferences.length).toBeGreaterThan(0);
  });

  it("should route request end-to-end and generate context budget", () => {
    const result = routeRequest("I want to build a skill for PDF parsing and publish to GitHub", "antigravity");
    expect(result.detectedHost).toBe("antigravity");
    expect(result.intent).toBe("DISTRIBUTE");
    expect(result.dag.length).toBeGreaterThan(0);
    expect(result.contextBudget.recommendedFiles.length).toBeGreaterThan(0);
    expect(result.explanation).toContain("confidence");
  });
});

describe("Plugin routing regressions", () => {
  it("preserves ChatGPT as a distinct target", () => {
    expect(classifyIntent("Port skill to ChatGPT and Codex").targetHosts).toEqual(["codex", "chatgpt"]);
  });
  it("does not confuse a report with porting or a repo mention with publishing", () => {
    expect(classifyIntent("Audit this skill and report findings").intent).toBe("VALIDATE");
    expect(classifyIntent("Audit the skill in this GitHub repo").intent).toBe("VALIDATE");
    expect(classifyIntent("Improve this skill and report the results").intent).toBe("IMPROVE");
  });
  it("routes security reviews before any distribution suggestion", () => {
    expect(classifyIntent("Review this third-party skill for security before publishing").intent).toBe("VALIDATE");
  });
  it("detects OpenCode without treating ordinary words containing roo as Cline", () => {
    expect(classifyIntent("Port skill to OpenCode").targetHosts).toEqual(["opencode"]);
    expect(classifyIntent("Build a skill for classroom planning").targetHosts).toEqual(["universal"]);
  });
});

describe("State overrides before release", () => {
  it("requires verification after a relevant mutation", () => {
    const result = routeRequest("Package this skill", "codex", { mutationGeneration: 2, verifiedGeneration: 1 });
    expect(result.intent).toBe("VALIDATE");
    expect(result.explanation).toContain("stale");
  });
  it("does not treat absent verification as release evidence", () => {
    expect(routeRequest("Publish this skill", "chatgpt", { mutationGeneration: 0 }).intent).toBe("VALIDATE");
  });
  it("prioritizes unresolved security and changes repeated failed attempts", () => {
    expect(routeRequest("Publish skill", "codex", { unresolvedSecurity: true }).intent).toBe("VALIDATE");
    expect(routeRequest("Package skill", "codex", { failureStreak: 2 }).intent).toBe("IMPROVE");
  });
  it("permits a fresh verified package route and rejects invalid generations", () => {
    expect(routeRequest("Package this skill", "codex", { mutationGeneration: 2, verifiedGeneration: 2 }).intent).toBe("PACKAGE");
    expect(() => routeRequest("Package skill", "codex", { mutationGeneration: -1 })).toThrow();
  });
});

describe("Packaged route resources", () => {
  it("resolves each step's deferred references from its owning skill", async () => {
    const { existsSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const modes = ["CREATE", "IMPROVE", "VALIDATE", "EVAL", "OPTIMIZE", "PORT", "PACKAGE", "DISTRIBUTE", "MEASURE", "INTEGRATE", "PRINCIPLES", "AUTHOR"] as const;
    for (const mode of modes) {
      for (const step of buildExecutionDag(mode)) {
        for (const ref of step.requiredReferences) {
          expect(existsSync(resolve(import.meta.dir, "../../../skills", step.skill, ref))).toBe(true);
        }
      }
    }
  });
  it("does not let the word principles hide an explicit security review", () => {
    expect(classifyIntent("Review skill security principles before publishing").intent).toBe("VALIDATE");
  });
});

describe("Skill topic versus requested action", () => {
  it("preserves creation, improvement, and porting for security-themed skills", () => {
    expect(classifyIntent("Create a security auditing skill for Codex").intent).toBe("CREATE");
    expect(classifyIntent("Port my security review skill to ChatGPT").intent).toBe("PORT");
    expect(classifyIntent("Improve this security auditing skill").intent).toBe("IMPROVE");
    expect(classifyIntent("Review this security skill before publishing").intent).toBe("VALIDATE");
    expect(classifyIntent("Check this skill for security before publishing").intent).toBe("VALIDATE");
    expect(classifyIntent("Inspect this security skill").intent).toBe("VALIDATE");
  });
});


describe("Review regression cases", () => {
  it("selects destination hosts without retaining the source host", () => {
    const result = routeRequest("Port this skill from Cursor to ChatGPT", "codex");
    expect(result.targetHosts).toEqual(["chatgpt"]);
    expect(result.dag.find(step => step.mode === "PORT")?.recommendedCommand).toContain("--target chatgpt");
    expect(classifyIntent("Port from Claude to ChatGPT and Codex").targetHosts).toEqual(["codex", "chatgpt"]);
  });
  it("recognizes explicit GitHub repository creation without broad repo matching", () => {
    expect(classifyIntent("Create a GitHub repo for this skill").intent).toBe("DISTRIBUTE");
    expect(classifyIntent("Audit this skill in a GitHub repository").intent).toBe("VALIDATE");
  });
});
