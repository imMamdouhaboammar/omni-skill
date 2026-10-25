import { describe, expect, it } from "bun:test";
import { scanSkillText } from "../src/core/security";

describe("Security Scanner - JavaScript and TypeScript AST / Sinks", () => {
  it("detects eval() in JavaScript/TypeScript scripts (AST2)", () => {
    const code = "const result = eval(untrustedString);";
    const findings = scanSkillText(code, "runner.ts", { isScript: true });
    expect(findings.some((f) => f.ruleId === "AST2" && f.severity === "CRITICAL")).toBe(true);
  });

  it("detects dynamic Function constructor execution in JS/TS (AST1)", () => {
    const codeNewFunc = "const fn = new Function('a', 'b', untrustedBody);";
    expect(scanSkillText(codeNewFunc, "evaluator.js", { isScript: true }).some((f) => f.ruleId === "AST1" && f.severity === "CRITICAL")).toBe(true);

    const codeFunc = "const fn = Function('return process')();";
    expect(scanSkillText(codeFunc, "evaluator.mjs", { isScript: true }).some((f) => f.ruleId === "AST1" && f.severity === "CRITICAL")).toBe(true);
  });

  it("detects child_process.exec and execSync in JS/TS (AST5)", () => {
    const codeExec = "import { exec } from 'child_process'; child_process.exec(cmd);";
    expect(scanSkillText(codeExec, "runner.ts", { isScript: true }).some((f) => f.ruleId === "AST5")).toBe(true);

    const codeExecSync = "child_process.execSync('rm -rf ' + path);";
    expect(scanSkillText(codeExecSync, "clean.js", { isScript: true }).some((f) => f.ruleId === "AST5")).toBe(true);
  });

  it("detects node-serialize deserialization in JS/TS (DS4)", () => {
    const code = "const deser = require('node-serialize');\ndeser.unserialize(payload);";
    expect(scanSkillText(code, "server.ts", { isScript: true }).some((f) => f.ruleId === "DS4" && f.severity === "HIGH")).toBe(true);
  });

  it("detects wildcard frontmatter tool permission in SKILL.md (LP2)", () => {
    const frontmatterString = {
      name: "wildcard-skill",
      "allowed-tools": "*",
    };
    const findingsStr = scanSkillText("content", "SKILL.md", { skillManifest: frontmatterString });
    expect(findingsStr.some((f) => f.ruleId === "LP2" && f.severity === "HIGH")).toBe(true);

    const frontmatterList = {
      name: "wildcard-skill",
      "allowed-tools": ["read_file", "*"],
    };
    const findingsList = scanSkillText("content", "SKILL.md", { skillManifest: frontmatterList });
    expect(findingsList.some((f) => f.ruleId === "LP2" && f.severity === "HIGH")).toBe(true);
  });
});
