import { describe, expect, it } from "bun:test";
import { scanSkillText } from "../src/core/security";

describe("Security Scanner - Python AST Behavioral Sinks", () => {
  it("detects direct exec and eval calls (AST1 and AST2)", () => {
    const code = "exec(dynamic_code)\neval(untrusted_expr)\n";
    const findings = scanSkillText(code, "script.py", { isScript: true });
    expect(findings.some((f) => f.ruleId === "AST1" && f.severity === "CRITICAL")).toBe(true);
    expect(findings.some((f) => f.ruleId === "AST2" && f.severity === "CRITICAL")).toBe(true);
  });

  it("detects dynamic __import__ and compile calls (AST3 and AST6)", () => {
    const code = "mod = __import__(user_module)\ncode_obj = compile(source, '<string>', 'exec')\n";
    const findings = scanSkillText(code, "script.py", { isScript: true });
    expect(findings.some((f) => f.ruleId === "AST3" && f.severity === "HIGH")).toBe(true);
    expect(findings.some((f) => f.ruleId === "AST6" && f.severity === "HIGH")).toBe(true);
  });

  it("detects os.system and os.popen shell execution sinks (AST5)", () => {
    const code = "import os\nos.system('whoami')\nos.popen('id')\n";
    const findings = scanSkillText(code, "script.py", { isScript: true });
    const ast5Findings = findings.filter((f) => f.ruleId === "AST5");
    expect(ast5Findings.length).toBe(2);
    expect(ast5Findings[0].severity).toBe("HIGH");
  });

  it("detects subprocess execution with shell=True (AST4)", () => {
    const code = "import subprocess\nsubprocess.run(command, shell=True)\n";
    const findings = scanSkillText(code, "script.py", { isScript: true });
    expect(findings.some((f) => f.ruleId === "AST4" && f.severity === "HIGH")).toBe(true);
  });

  it("detects reflective execution handles via getattr (AST9)", () => {
    const code = "import os\nfn = getattr(os, 'system')\nfn('id')\n";
    const findings = scanSkillText(code, "script.py", { isScript: true });
    expect(findings.some((f) => f.ruleId === "AST9" && f.severity === "CRITICAL")).toBe(true);
  });

  it("detects insecure YAML loading and distinguishes safe YAML loader (AST10)", () => {
    const safe = `
import yaml
data1 = yaml.load(content, Loader=yaml.SafeLoader)
data2 = yaml.load(content, yaml.CSafeLoader)
`;
    expect(scanSkillText(safe, "safe.py", { isScript: true }).some((f) => f.ruleId === "AST10")).toBe(false);

    const unsafe = `
import yaml
data1 = yaml.load(content)
data2 = yaml.unsafe_load(content)
`;
    const findings = scanSkillText(unsafe, "unsafe.py", { isScript: true });
    const ast10 = findings.filter((f) => f.ruleId === "AST10");
    expect(ast10.length).toBe(2);
  });
});
