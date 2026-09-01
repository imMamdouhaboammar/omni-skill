import { describe, expect, it } from "bun:test";
import { classifyIntent, detectHost, buildExecutionDag, routeRequest } from "../src/core/router";

describe("OmniSkill Dynamic Agentic Router", () => {
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
  });

  it("should classify Arabic natural language intents", () => {
    expect(classifyIntent("انشر المهارة دي على github ووزعها").intent).toBe("DISTRIBUTE");
    expect(classifyIntent("صلح المشكلة دي في المهارة").intent).toBe("IMPROVE");
    expect(classifyIntent("اختبر المهارة واعمل evals").intent).toBe("EVAL");
    expect(classifyIntent("حول المهارة دي ل cursor").intent).toBe("PORT");
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
