import { describe, expect, it, afterEach, beforeEach } from "bun:test";
import {
  mkdtempSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  symlinkSync,
  readdirSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const CLI_ENTRY = join(__dirname, "../src/index.ts");

function runCli(args: string[], cwd?: string) {
  return spawnSync("bun", ["run", CLI_ENTRY, ...args], {
    cwd: cwd || process.cwd(),
    encoding: "utf-8",
    env: { ...process.env, NO_COLOR: "1" }
  });
}

function sha256(filePath: string): string {
  const data = readFileSync(filePath);
  return createHash("sha256").update(data).digest("hex");
}

describe("omni-skill init non-destructive safety (#10)", () => {
  let tempBase: string;

  beforeEach(() => {
    tempBase = mkdtempSync(join(tmpdir(), "omni-init-test-"));
  });

  afterEach(() => {
    if (existsSync(tempBase)) {
      rmSync(tempBase, { recursive: true, force: true });
    }
  });

  it("succeeds on a fresh destination and produces valid structure", () => {
    const res = runCli(["init", "fresh-skill", "-o", tempBase]);
    expect(res.status).toBe(0);

    const skillDir = join(tempBase, "fresh-skill");
    expect(existsSync(join(skillDir, "SKILL.md"))).toBe(true);
    expect(existsSync(join(skillDir, "usecases", "run.md"))).toBe(true);
    expect(existsSync(join(skillDir, "references", "spec.md"))).toBe(true);
    expect(existsSync(join(skillDir, "evals", "evals.json"))).toBe(true);

    const skillContent = readFileSync(join(skillDir, "SKILL.md"), "utf-8");
    expect(skillContent).toContain("author: Omni Skill");
    expect(skillContent).toContain("https://github.com/imMamdouhaboammar/omni-skill");
    expect(skillContent).toContain("## Attribution & Provenance");
    expect(skillContent).toContain("[Omni Skill](https://github.com/imMamdouhaboammar/omni-skill)");
  });

  it("refuses to overwrite an existing skill directory and returns nonzero exit code", () => {
    // 1. Initial creation
    const init1 = runCli(["init", "existing-skill", "-o", tempBase]);
    expect(init1.status).toBe(0);

    const skillDir = join(tempBase, "existing-skill");
    const skillMd = join(skillDir, "SKILL.md");
    const evalsJson = join(skillDir, "evals", "evals.json");

    // Modify files with custom content
    const customSkillContent = "# Custom Unmodified SKILL.md Content\nDo not overwrite.";
    const customEvalContent = JSON.stringify({ custom: "data-do-not-overwrite" });
    writeFileSync(skillMd, customSkillContent, "utf-8");
    writeFileSync(evalsJson, customEvalContent, "utf-8");

    const hashBeforeSkill = sha256(skillMd);
    const hashBeforeEval = sha256(evalsJson);

    // 2. Second initialization attempt with identical name
    const init2 = runCli(["init", "existing-skill", "-o", tempBase]);
    expect(init2.status).toBe(1);
    expect(init2.stdout + init2.stderr).toContain("already exists");

    // 3. Assert content remains byte-identical
    expect(sha256(skillMd)).toBe(hashBeforeSkill);
    expect(sha256(evalsJson)).toBe(hashBeforeEval);
    expect(readFileSync(skillMd, "utf-8")).toBe(customSkillContent);
    expect(readFileSync(evalsJson, "utf-8")).toBe(customEvalContent);
  });

  it("refuses to overwrite a partially populated existing directory and preserves all files", () => {
    const partialDir = join(tempBase, "partial-skill");
    mkdirSync(partialDir, { recursive: true });

    const sentinel = join(partialDir, "pre-existing.txt");
    writeFileSync(sentinel, "important-user-work", "utf-8");
    const sentinelHash = sha256(sentinel);

    const res = runCli(["init", "partial-skill", "-o", tempBase]);
    expect(res.status).toBe(1);
    expect(res.stdout + res.stderr).toContain("already exists");

    // Sentinel must be untouched
    expect(existsSync(sentinel)).toBe(true);
    expect(sha256(sentinel)).toBe(sentinelHash);

    // SKILL.md must NOT have been created
    expect(existsSync(join(partialDir, "SKILL.md"))).toBe(false);
  });

  it("rejects empty string skill name without creating directories in output root", () => {
    const res = runCli(["init", "", "-o", tempBase]);
    expect(res.status).toBe(1);
    expect(res.stdout + res.stderr).toMatch(/invalid|empty/i);

    const entries = readdirSync(tempBase);
    expect(entries.length).toBe(0);
  });

  it("rejects whitespace-only skill names without creating directories", () => {
    const res = runCli(["init", "   ", "-o", tempBase]);
    expect(res.status).toBe(1);
    expect(res.stdout + res.stderr).toMatch(/invalid|empty/i);

    const entries = readdirSync(tempBase);
    expect(entries.length).toBe(0);
  });

  it("rejects normalized empty names like '--' or '---' without mutating filesystem", () => {
    const res = runCli(["init", "--", "---", "-o", tempBase]);
    expect(res.status).toBe(1);

    const entries = readdirSync(tempBase);
    expect(entries.length).toBe(0);
  });

  it("rejects names that normalize to empty or purely hyphens like '...--...' without mutating filesystem", () => {
    const res = runCli(["init", "...--...", "-o", tempBase]);
    expect(res.status).toBe(1);

    const entries = readdirSync(tempBase);
    expect(entries.length).toBe(0);
  });

  it("refuses to overwrite an existing regular file at the target path", () => {
    const fileTarget = join(tempBase, "file-collision");
    writeFileSync(fileTarget, "I am a file, not a directory", "utf-8");
    const fileHash = sha256(fileTarget);

    const res = runCli(["init", "file-collision", "-o", tempBase]);
    expect(res.status).toBe(1);
    expect(res.stdout + res.stderr).toContain("already exists");

    expect(existsSync(fileTarget)).toBe(true);
    expect(sha256(fileTarget)).toBe(fileHash);
    expect(readFileSync(fileTarget, "utf-8")).toBe("I am a file, not a directory");
  });

  it("refuses to overwrite or follow an existing symlink at target path", () => {
    const realTargetDir = join(tempBase, "actual-target");
    mkdirSync(realTargetDir, { recursive: true });
    writeFileSync(join(realTargetDir, "canary.txt"), "canary-alive", "utf-8");
    const canaryHash = sha256(join(realTargetDir, "canary.txt"));

    const symlinkPath = join(tempBase, "symlink-skill");
    symlinkSync(realTargetDir, symlinkPath);

    const res = runCli(["init", "symlink-skill", "-o", tempBase]);
    expect(res.status).toBe(1);
    expect(res.stdout + res.stderr).toContain("already exists");

    // Canary in symlinked target must be completely untouched
    expect(sha256(join(realTargetDir, "canary.txt"))).toBe(canaryHash);
    expect(existsSync(join(realTargetDir, "SKILL.md"))).toBe(false);
  });
});
