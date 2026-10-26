import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { evalSkillCommand } from "../src/commands/eval";

const CLI_ENTRY = join(__dirname, "../src/index.ts");

function runCli(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  const result = spawnSync("bun", ["run", CLI_ENTRY, ...args], {
    encoding: "utf-8",
    env: { ...process.env, NO_COLOR: "1" }
  });
  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    exitCode: result.status ?? 1
  };
}

describe("CLI eval Command Contract (#1)", () => {
  let rootDir: string;
  let skillDir: string;
  let evalsDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "omni-eval-test-"));
    skillDir = join(rootDir, "test-skill");
    evalsDir = join(skillDir, "evals");
    mkdirSync(skillDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("should fail closed with non-zero exit when evals/evals.json is absent", () => {
    const res = runCli(["eval", skillDir]);
    expect(res.exitCode).toBe(1);
    expect(res.stdout).toContain("Cannot evaluate without an evaluation suite");
    expect(res.stdout).not.toContain("100%");
    expect(res.stdout).not.toContain("Baseline structural test passed");
  });

  it("should fail closed with non-zero exit when evals suite is empty", () => {
    mkdirSync(evalsDir, { recursive: true });
    writeFileSync(join(evalsDir, "evals.json"), JSON.stringify({ evals: [] }));

    const res = runCli(["eval", skillDir]);
    expect(res.exitCode).toBe(1);
    expect(res.stdout).toContain("Evaluation suite contains no test cases (empty suite)");
    expect(res.stdout).not.toContain("100%");
  });

  it("should mark all cases UNVERIFIED and exit non-zero when no response is provided", () => {
    mkdirSync(evalsDir, { recursive: true });
    writeFileSync(
      join(evalsDir, "evals.json"),
      JSON.stringify({
        evals: [
          {
            id: "case-query-optimization",
            assertions: [{ pattern: "EXPLAIN ANALYZE", required: true }]
          }
        ]
      })
    );

    const res = runCli(["eval", skillDir]);
    expect(res.exitCode).toBe(1);
    expect(res.stdout).toContain("unverified");
    expect(res.stdout).toContain("No observed candidate response provided");
    expect(res.stdout).not.toContain("100%");
  });

  it("should execute assertions against candidate string and report 100% pass on match", () => {
    mkdirSync(evalsDir, { recursive: true });
    writeFileSync(
      join(evalsDir, "evals.json"),
      JSON.stringify({
        evals: [
          {
            id: "case-query-optimization",
            assertions: [
              { pattern: "EXPLAIN ANALYZE", required: true },
              { pattern: "SELECT", required: true }
            ]
          }
        ]
      })
    );

    const res = runCli([
      "eval",
      skillDir,
      "--candidate",
      "We will run EXPLAIN ANALYZE on SELECT * FROM users;"
    ]);

    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain("[CASE: case-query-optimization] passed");
    expect(res.stdout).toContain("100% pass rate");
  });

  it("should report FAILED and exit non-zero when a required assertion pattern fails", () => {
    mkdirSync(evalsDir, { recursive: true });
    writeFileSync(
      join(evalsDir, "evals.json"),
      JSON.stringify({
        evals: [
          {
            id: "case-query-optimization",
            assertions: [
              { pattern: "EXPLAIN ANALYZE", required: true }
            ]
          }
        ]
      })
    );

    const res = runCli([
      "eval",
      skillDir,
      "--candidate",
      "Just simple select query without analysis."
    ]);

    expect(res.exitCode).toBe(1);
    expect(res.stdout).toContain("[CASE: case-query-optimization] failed");
    expect(res.stdout).toContain("Required pattern '/EXPLAIN ANALYZE/' did not match");
    expect(res.stdout).not.toContain("100%");
  });

  it("should report FAILED when a non-required assertion pattern is unexpectedly present", () => {
    mkdirSync(evalsDir, { recursive: true });
    writeFileSync(
      join(evalsDir, "evals.json"),
      JSON.stringify({
        evals: [
          {
            id: "case-safety-check",
            assertions: [
              { pattern: "DROP TABLE", required: false }
            ]
          }
        ]
      })
    );

    const res = runCli([
      "eval",
      skillDir,
      "--candidate",
      "I recommend to DROP TABLE users CASCADE;"
    ]);

    expect(res.exitCode).toBe(1);
    expect(res.stdout).toContain("[CASE: case-safety-check] failed");
    expect(res.stdout).toContain("Forbidden pattern '/DROP TABLE/' unexpectedly matched");
    expect(res.stdout).not.toContain("100%");
  });

  it("should handle mixed passing and failing cases in a multi-case suite", () => {
    mkdirSync(evalsDir, { recursive: true });
    writeFileSync(
      join(evalsDir, "evals.json"),
      JSON.stringify({
        evals: [
          {
            id: "case-pass",
            assertions: [{ pattern: "alpha", required: true }]
          },
          {
            id: "case-fail",
            assertions: [{ pattern: "beta", required: true }]
          }
        ]
      })
    );

    const res = runCli([
      "eval",
      skillDir,
      "--candidate",
      "The response only contains alpha keyword."
    ]);

    expect(res.exitCode).toBe(1);
    expect(res.stdout).toContain("[CASE: case-pass] passed");
    expect(res.stdout).toContain("[CASE: case-fail] failed");
    expect(res.stdout).toContain("1/2 passed (50.0%)");
    expect(res.stdout).not.toContain("100%");
  });

  it("should evaluate per-case responses provided via --responses JSON file", () => {
    mkdirSync(evalsDir, { recursive: true });
    writeFileSync(
      join(evalsDir, "evals.json"),
      JSON.stringify({
        evals: [
          {
            id: "case-1",
            assertions: [{ pattern: "alpha", required: true }]
          },
          {
            id: "case-2",
            assertions: [{ pattern: "beta", required: true }]
          }
        ]
      })
    );

    const responsesFile = join(rootDir, "responses.json");
    writeFileSync(
      responsesFile,
      JSON.stringify({
        "case-1": "This response contains alpha.",
        "case-2": "This response contains beta."
      })
    );

    const res = runCli([
      "eval",
      skillDir,
      "--responses",
      responsesFile
    ]);

    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain("[CASE: case-1] passed");
    expect(res.stdout).toContain("[CASE: case-2] passed");
    expect(res.stdout).toContain("2/2 passed (100.0%)");
  });

  it("should handle invalid regular expressions gracefully without unhandled exceptions", () => {
    mkdirSync(evalsDir, { recursive: true });
    writeFileSync(
      join(evalsDir, "evals.json"),
      JSON.stringify({
        evals: [
          {
            id: "case-malformed-regex",
            assertions: [{ pattern: "[unclosed-bracket(", required: true }]
          }
        ]
      })
    );

    const res = runCli([
      "eval",
      skillDir,
      "--candidate",
      "Any text candidate"
    ]);

    expect(res.exitCode).toBe(1);
    expect(res.stdout).toContain("[CASE: case-malformed-regex] error");
    expect(res.stdout).toContain("Invalid regular expression");
    expect(res.stdout).not.toContain("100%");
  });

  it("should emit structured machine-readable JSON with --json flag", () => {
    mkdirSync(evalsDir, { recursive: true });
    writeFileSync(
      join(evalsDir, "evals.json"),
      JSON.stringify({
        evals: [
          {
            id: "case-1",
            assertions: [{ pattern: "pass_token", required: true }]
          },
          {
            id: "case-2",
            assertions: [{ pattern: "missing_token", required: true }]
          }
        ]
      })
    );

    const res = runCli([
      "eval",
      skillDir,
      "--candidate",
      "Here is the pass_token",
      "--json"
    ]);

    expect(res.exitCode).toBe(1);
    const parsed = JSON.parse(res.stdout);
    expect(parsed.status).toBe("FAIL");
    expect(parsed.total).toBe(2);
    expect(parsed.passed).toBe(1);
    expect(parsed.failed).toBe(1);
    expect(parsed.unverified).toBe(0);
    expect(parsed.pass_rate).toBe(0.5);
    expect(parsed.results).toHaveLength(2);
    expect(parsed.results[0].passed).toBe(true);
    expect(parsed.results[1].passed).toBe(false);
  });
});
