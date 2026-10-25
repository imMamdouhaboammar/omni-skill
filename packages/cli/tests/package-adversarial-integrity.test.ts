import { describe, expect, it, spyOn, beforeEach, afterEach } from "bun:test";
import {
  packageSkillCommand,
  verifyArchiveIntegrity,
} from "../src/commands/package";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unzipSync, zipSync } from "fflate";

describe("packageSkillCommand - Adversarial Integrity & Packaging Edge Cases", () => {
  let logOutput: string[] = [];
  let exitCode: number | null = null;
  let logSpy: any;
  let exitSpy: any;

  beforeEach(() => {
    logOutput = [];
    exitCode = null;
    logSpy = spyOn(console, "log").mockImplementation((...args: any[]) => {
      logOutput.push(args.join(" "));
    });
    exitSpy = spyOn(process, "exit").mockImplementation(((code?: number) => {
      exitCode = code ?? 0;
      throw new Error(`PROCESS_EXIT_${code ?? 0}`);
    }) as any);
  });

  afterEach(() => {
    logSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("packages deep nested directories and verifies 100% byte fidelity", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-deep-pack-"));
    try {
      const skillDir = join(tempBase, "deep-skill");
      mkdirSync(skillDir);
      writeFileSync(
        join(skillDir, "SKILL.md"),
        `---
name: deep-skill
description: A deeply nested skill.
---
# Why This Skill Is Needed
Target State
`
      );
      const deepDir = join(skillDir, "a", "b", "c", "d");
      mkdirSync(deepDir, { recursive: true });
      const payloadBytes = Buffer.from("Deeply nested file payload with binary data: \x01\x02\x03\x04");
      writeFileSync(join(deepDir, "data.txt"), payloadBytes);

      const outDir = join(tempBase, "releases");
      packageSkillCommand(skillDir, { out: outDir });

      expect(exitCode).toBeNull();
      const archivePath = join(outDir, "deep-skill.skill");
      expect(existsSync(archivePath)).toBe(true);

      const unzipped = unzipSync(readFileSync(archivePath));
      expect(unzipped["deep-skill/a/b/c/d/data.txt"]).toBeDefined();
      expect(Buffer.compare(Buffer.from(unzipped["deep-skill/a/b/c/d/data.txt"]), payloadBytes)).toBe(0);
    } finally {
      rmSync(tempBase, { recursive: true });
    }
  });

  it("archive verification fails when an entry is truncated in archive", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-trunc-test-"));
    try {
      const skillDir = join(tempBase, "trunc-skill");
      mkdirSync(skillDir);
      writeFileSync(join(skillDir, "SKILL.md"), "Full 30 characters long string!!");

      const truncatedZip = zipSync({
        "trunc-skill/SKILL.md": new TextEncoder().encode("Truncated"),
      });

      const res = verifyArchiveIntegrity(truncatedZip, skillDir, "trunc-skill");
      expect(res.ok).toBe(false);
      expect(res.reason).toContain("File size mismatch");
    } finally {
      rmSync(tempBase, { recursive: true });
    }
  });

  it("archive verification fails if archive contains unauthorized .env file", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-env-test-"));
    try {
      const skillDir = join(tempBase, "env-skill");
      mkdirSync(skillDir);
      writeFileSync(join(skillDir, "SKILL.md"), "content");

      const zipWithEnv = zipSync({
        "env-skill/SKILL.md": new TextEncoder().encode("content"),
        "env-skill/.env": new TextEncoder().encode("SECRET=123"),
      });

      const res = verifyArchiveIntegrity(zipWithEnv, skillDir, "env-skill");
      expect(res.ok).toBe(false);
      expect(res.reason).toContain("prohibited");
    } finally {
      rmSync(tempBase, { recursive: true });
    }
  });

  it("refuses to package when nested file is a symlink", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-nested-symlink-"));
    try {
      const skillDir = join(tempBase, "sym-skill");
      mkdirSync(skillDir);
      writeFileSync(
        join(skillDir, "SKILL.md"),
        `---
name: sym-skill
description: Has nested symlink.
---
# Why
Target
`
      );
      const scripts = join(skillDir, "scripts");
      mkdirSync(scripts);
      const outside = join(tempBase, "target.txt");
      writeFileSync(outside, "outside");
      symlinkSync(outside, join(scripts, "link.sh"));

      const outDir = join(tempBase, "out");
      try {
        packageSkillCommand(skillDir, { out: outDir });
      } catch {
        // expect exit(1)
      }

      expect(exitCode).toBe(1);
      expect(existsSync(join(outDir, "sym-skill.skill"))).toBe(false);
    } finally {
      rmSync(tempBase, { recursive: true });
    }
  });

  it("refuses to package when output directory is inside the skill directory", () => {
    const tempBase = mkdtempSync(join(tmpdir(), "omni-out-inside-"));
    try {
      const skillDir = join(tempBase, "test-skill");
      mkdirSync(skillDir);
      writeFileSync(
        join(skillDir, "SKILL.md"),
        `---
name: test-skill
description: Testing output directory constraints.
---
# Why
Target
`
      );
      const insideOut = join(skillDir, "sub-out");

      try {
        packageSkillCommand(skillDir, { out: insideOut });
      } catch {
        // expect exit(1)
      }

      expect(exitCode).toBe(1);
      expect(logOutput.join("\n")).toContain("Output directory must be outside the skill");
    } finally {
      rmSync(tempBase, { recursive: true });
    }
  });
});
