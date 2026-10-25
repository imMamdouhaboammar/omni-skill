import { describe, expect, it, test, afterAll, beforeAll } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, chmodSync, symlinkSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { unzipSync } from "fflate";

const CLI_ENTRY = join(__dirname, "../src/index.ts");

function runCli(args: string[], cwd?: string) {
  return spawnSync("bun", ["run", CLI_ENTRY, ...args], {
    cwd: cwd || process.cwd(),
    encoding: "utf-8",
    env: { ...process.env, NO_COLOR: "1" }
  });
}

describe("CLI End-to-End Test Suite", () => {
  let tempBase: string;

  beforeAll(() => {
    tempBase = mkdtempSync(join(tmpdir(), "omni-cli-e2e-"));
    const fixture = runCli(["init", "weather-reporter", "-o", tempBase]);
    if (fixture.status !== 0) throw new Error(`Could not initialize fixture: ${fixture.stderr}`);
  });

  afterAll(() => {
    if (existsSync(tempBase)) {
      rmSync(tempBase, { recursive: true, force: true });
    }
  });

  describe("omni-skill init", () => {
    it("should initialize a complete skill structure with default options", () => {
      const res = runCli(["init", "default-options-skill", "-o", tempBase]);
      expect(res.status).toBe(0);

      const skillDir = join(tempBase, "default-options-skill");
      expect(existsSync(join(skillDir, "SKILL.md"))).toBe(true);
      expect(existsSync(join(skillDir, "usecases", "run.md"))).toBe(true);
      expect(existsSync(join(skillDir, "references", "spec.md"))).toBe(true);
      expect(existsSync(join(skillDir, "evals", "evals.json"))).toBe(true);

      const skillMd = readFileSync(join(skillDir, "SKILL.md"), "utf-8");
      expect(skillMd).toContain("name: default-options-skill");
      expect(skillMd).toContain("Why This Skill Is Needed & Target State");
      expect(skillMd).toContain("Invariant Rules");
    });

    it("should exit with code 1 when attempting to re-initialize an existing skill", () => {
      const res = runCli(["init", "weather-reporter", "-o", tempBase]);
      expect(res.status).toBe(1);
      expect(res.stdout + res.stderr).toContain("already exists");
    });

    it("should initialize with custom description", () => {
      const desc = "Custom weather lookup engine";
      const res = runCli(["init", "custom-weather", "-d", desc, "-o", tempBase]);
      expect(res.status).toBe(0);

      const skillMd = readFileSync(join(tempBase, "custom-weather", "SKILL.md"), "utf-8");
      expect(skillMd).toContain(desc);
    });
  });

  describe("omni-skill validate", () => {
    it("should pass cleanly on a freshly initialized skill", () => {
      const skillDir = join(tempBase, "weather-reporter");
      const res = runCli(["validate", skillDir]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain("Perfectly formatted OmniSkill");
    });

    it("should exit with code 1 when validating a broken skill", () => {
      const brokenDir = join(tempBase, "broken-skill");
      runCli(["init", "broken-skill", "-o", tempBase]);
      // Introduce an invalid name
      writeFileSync(join(brokenDir, "SKILL.md"), "---\nname: INVALID_NAME\ndescription: test\n---\n# Bad");

      const res = runCli(["validate", brokenDir]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("INVALID_NAME");
    });

    it("should exit with code 1 when validating an empty directory", () => {
      const emptyDir = join(tempBase, "empty-dir-e2e");
      mkdirSync(emptyDir);
      const res = runCli(["validate", emptyDir]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("MISSING_SKILL_MD");
      expect(res.stdout).toContain("0/1 skills valid (1 errors, 0 warnings)");
    });

    it("should exit with code 1 when validating a non-existent skill root", () => {
      const nonExistent = join(tempBase, "does-not-exist-dir");
      const res = runCli(["validate", nonExistent]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("INVALID_ROOT");
      expect(res.stdout).toContain("0/1 skills valid (1 errors, 0 warnings)");
    });

    it("should exit with code 1 when validating a regular file as skill root", () => {
      const filePath = join(tempBase, "regular-file.txt");
      writeFileSync(filePath, "regular file content");
      const res = runCli(["validate", filePath]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("INVALID_ROOT");
      expect(res.stdout).toContain("0/1 skills valid (1 errors, 0 warnings)");
    });

    it("should exit with code 1 when validating a skill with unreadable SKILL.md", () => {
      const dir = join(tempBase, "unreadable-md-skill");
      runCli(["init", "unreadable-md-skill", "-o", tempBase]);
      const mdPath = join(dir, "SKILL.md");
      chmodSync(mdPath, 0o000);
      try {
        const res = runCli(["validate", dir]);
        expect(res.status).toBe(1);
        expect(res.stdout).toContain("READ_FAILURE");
        expect(res.stdout).toContain("0/1 skills valid (1 errors, 0 warnings)");
      } finally {
        chmodSync(mdPath, 0o644);
      }
    });

    it("should exit with code 1 when validating a skill with broken symlink", () => {
      const dir = join(tempBase, "broken-symlink-skill");
      runCli(["init", "broken-symlink-skill", "-o", tempBase]);
      symlinkSync("non-existent-target.txt", join(dir, "symlink.txt"));
      const res = runCli(["validate", dir]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("READ_FAILURE");
      expect(res.stdout).toContain("0/1 skills valid");
    });

    it("should fail validation and exit 1 when multiple roots are passed and one is invalid", () => {
      const validDir = join(tempBase, "weather-reporter");
      const missingDir = join(tempBase, "missing-skill-sub");
      const res = runCli(["validate", validDir, missingDir]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("1/2 skills valid (1 errors, 0 warnings)");
    });

    it("should not leak user absolute paths in error messages", () => {
      const dir = join(tempBase, "leak-check-skill");
      runCli(["init", "leak-check-skill", "-o", tempBase]);
      const unreadFile = join(dir, "secret.md");
      writeFileSync(unreadFile, "unreadable");
      chmodSync(unreadFile, 0o000);
      try {
        const res = runCli(["validate", dir]);
        expect(res.status).toBe(1);
        expect(res.stdout).not.toMatch(/\/Users\/[a-zA-Z0-9_.-]+\//);
      } finally {
        chmodSync(unreadFile, 0o644);
      }
    });
  });

  describe("omni-skill port", () => {
    const portTargets = [
      { target: "claude", expectedFile: ".claude-plugin/plugin.json" },
      { target: "codex", expectedFile: ".codex-plugin/plugin.json" },
      { target: "antigravity", expectedFile: ".gemini/plugin.json" },
      { target: "cursor", expectedFile: ".cursorrules" },
      { target: "windsurf", expectedFile: ".windsurfrules" },
      { target: "cline", expectedFile: ".clinerules" },
      { target: "copilot", expectedFile: ".github/copilot-instructions.md" },
      { target: "opencode", expectedFile: ".opencode/skill.json" },
      { target: "generic", expectedFile: ".agents/plugins/marketplace.json" }
    ];

    test.each(portTargets)("should port cleanly to target $target with -o option", ({ target, expectedFile }) => {
      const skillDir = join(tempBase, "weather-reporter");
      const outDir = join(tempBase, `port-${target}`);
      const res = runCli(["port", skillDir, "-t", target, "-o", outDir]);

      expect(res.status).toBe(0);
      expect(existsSync(join(outDir, expectedFile))).toBe(true);
    });
  });

  describe("omni-skill compile", () => {
    it("should compile a valid JSON spec into a complete skill directory", () => {
      const specPath = join(tempBase, "test-spec.json");
      const outDir = join(tempBase, "compiled-output");
      writeFileSync(
        specPath,
        JSON.stringify({
          name: "compiled-calc",
          description: "A compiled arithmetic helper.",
          job: "Performs accurate calculation without floating point drift.",
          instructions: ["Step 1: Parse operands", "Step 2: Execute operation"],
          target_hosts: ["chatgpt", "claude-code"],
          references: {
            "math-spec": "# Math Spec\nPrecise decimal arithmetic rules."
          },
          evals: [
            { id: "eval-add", assertions: [{ pattern: "sum", required: true }] }
          ]
        })
      );

      const res = runCli(["compile", specPath, "-o", outDir]);
      expect(res.status).toBe(0);

      const skillPath = join(outDir, "compiled-calc");
      expect(existsSync(join(skillPath, "SKILL.md"))).toBe(true);
      expect(existsSync(join(skillPath, "references", "math-spec.md"))).toBe(true);
      expect(existsSync(join(skillPath, "evals", "evals.json"))).toBe(true);
    });

    it("should exit with code 1 when specification file is missing", () => {
      const res = runCli(["compile", join(tempBase, "non-existent-spec.json")]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("Specification file not found");
    });

    it("should exit with code 1 when specification file contains malformed JSON", () => {
      const badSpec = join(tempBase, "malformed-spec.json");
      writeFileSync(badSpec, "{ unquoted_key: invalid }");

      const res = runCli(["compile", badSpec]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("Failed to parse JSON specification");
    });

    it("should exit with code 1 when specification has an adversarial skill name escaping output directory", () => {
      const escapeSpec = join(tempBase, "escape-spec.json");
      writeFileSync(
        escapeSpec,
        JSON.stringify({
          name: "../escaped-calc",
          description: "Malicious calc",
          job: "Escape",
          instructions: ["Step 1"]
        })
      );
      const outDir = join(tempBase, "compiled-output");
      const res = runCli(["compile", escapeSpec, "-o", outDir]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("Failed to compile skill");
      expect(existsSync(join(tempBase, "escaped-calc"))).toBe(false);
    });

    it("should exit with code 1 when specification has an adversarial reference name escaping references directory", () => {
      const escapeRefSpec = join(tempBase, "escape-ref-spec.json");
      writeFileSync(
        escapeRefSpec,
        JSON.stringify({
          name: "safe-skill-bad-ref",
          description: "Skill with bad ref",
          job: "Escape",
          instructions: ["Step 1"],
          references: {
            "../escaped-ref": "evil"
          }
        })
      );
      const outDir = join(tempBase, "compiled-output");
      const res = runCli(["compile", escapeRefSpec, "-o", outDir]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("Failed to compile skill");
      expect(existsSync(join(outDir, "escaped-ref.md"))).toBe(false);
      expect(existsSync(join(tempBase, "escaped-ref.md"))).toBe(false);
    });
  });

  describe("omni-skill eval", () => {
    it("should evaluate a skill with evals.json and report 100% pass rate", () => {
      const skillDir = join(tempBase, "weather-reporter");
      const res = runCli(["eval", skillDir]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain("All 2 evaluation cases verified with 100% pass rate");
    });

    it("should handle skills without evals.json with baseline structural check", () => {
      const noEvalDir = join(tempBase, "no-eval-skill");
      runCli(["init", "no-eval-skill", "-o", tempBase]);
      rmSync(join(noEvalDir, "evals"), { recursive: true, force: true });

      const res = runCli(["eval", noEvalDir]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain("No evals/evals.json found. Generating baseline trigger check");
    });

    it("should exit with code 1 when evals.json contains malformed JSON", () => {
      const corruptSkillDir = join(tempBase, "corrupt-eval-skill");
      runCli(["init", "corrupt-eval-skill", "-o", tempBase]);
      writeFileSync(join(corruptSkillDir, "evals", "evals.json"), "{ invalid: json");

      const res = runCli(["eval", corruptSkillDir]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("Failed to parse evals.json");
    });
  });

  describe("omni-skill package", () => {
    it("should validate and certify a clean skill for distribution", () => {
      const skillDir = join(tempBase, "weather-reporter");
      const outDir = join(tempBase, "package-dist");
      writeFileSync(join(skillDir, ".env"), "OPENAI_API_KEY=hidden-test-value");
      const res = runCli(["package", skillDir, "-o", outDir]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain("Package ready for distribution");
      const archive = join(outDir, "weather-reporter.skill");
      expect(existsSync(archive)).toBe(true);
      const archiveData = readFileSync(archive);
      expect(archiveData.subarray(0, 4).toString("hex")).toBe("504b0304");
      expect(archiveData.length).toBeGreaterThan(60);
      const entries = unzipSync(new Uint8Array(archiveData));
      expect(new TextDecoder().decode(entries["weather-reporter/SKILL.md"])).toContain("name: weather-reporter");
      expect(entries["weather-reporter/evals/evals.json"]).toBeDefined();
      expect(entries["weather-reporter/.env"]).toBeUndefined();
      const repeated = runCli(["package", skillDir, "-o", outDir]);
      expect(repeated.status).toBe(1);
    });

    it("should exit with code 1 when packaging an invalid skill", () => {
      const brokenDir = join(tempBase, "broken-skill");
      const res = runCli(["package", brokenDir]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("Cannot package skill with validation errors");
    });

    it("should exit with code 1 when packaging a skill with unreadable SKILL.md without crash", () => {
      const dir = join(tempBase, "pkg-unreadable-skill");
      runCli(["init", "pkg-unreadable-skill", "-o", tempBase]);
      const mdPath = join(dir, "SKILL.md");
      chmodSync(mdPath, 0o000);
      try {
        const res = runCli(["package", dir]);
        expect(res.status).toBe(1);
        expect(res.stdout).toContain("Cannot package skill with validation errors");
        expect(res.stderr).not.toContain("EACCES: permission denied");
      } finally {
        chmodSync(mdPath, 0o644);
      }
    });
  });

  describe("omni-skill route", () => {
    const routeScenarios = [
      { prompt: "audit my rust smart contract security", expectedIntent: "VALIDATE" },
      { prompt: "create a new postgres query skill", expectedIntent: "CREATE" },
      { prompt: "port this tool to claude code", expectedIntent: "PORT" },
      { prompt: "publish this skill to skills.sh", expectedIntent: "DISTRIBUTE" },
      { prompt: "optimize description to trigger better", expectedIntent: "OPTIMIZE" }
    ];

    test.each(routeScenarios)("should correctly route prompt '$prompt' to $expectedIntent", ({ prompt, expectedIntent }) => {
      const res = runCli(["route", prompt]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain(`Intent:        ${expectedIntent}`);
    });

    it("should emit valid JSON execution graph with -j flag", () => {
      const res = runCli(["route", "design a new data scraper", "-j"]);
      expect(res.status).toBe(0);

      const parsed = JSON.parse(res.stdout);
      expect(parsed).toHaveProperty("intent", "CREATE");
      expect(parsed).toHaveProperty("dag");
      expect(Array.isArray(parsed.dag)).toBe(true);
      expect(parsed.dag.length).toBeGreaterThan(0);
      expect(parsed).toHaveProperty("contextBudget");
      expect(parsed.contextBudget.maxTokens).toBeGreaterThan(0);
    });

    it("should include router rationale when -e flag is passed", () => {
      const res = runCli(["route", "measure latency and benchmark", "-e"]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain("Router Rationale:");
    });
  });
});
