import { describe, expect, it } from "bun:test";
import {
  isSafeBinaryAsset,
  isScriptFile,
  shouldExcludeSkillFile,
} from "../src/core/security-exclusions";

describe("Security Exclusions and Binary Magic Byte Validation", () => {
  it("excludes dotfiles, conftest.py, and .DS_Store", () => {
    expect(shouldExcludeSkillFile(".env")).toBe(true);
    expect(shouldExcludeSkillFile(".DS_Store")).toBe(true);
    expect(shouldExcludeSkillFile("conftest.py")).toBe(true);
    expect(shouldExcludeSkillFile("subdir/.env.local")).toBe(true);
  });

  it("excludes tests/ directory and test files", () => {
    expect(shouldExcludeSkillFile("tests/bad.sh")).toBe(true);
    expect(shouldExcludeSkillFile("scripts/test_bad.py")).toBe(true);
    expect(shouldExcludeSkillFile("scripts/bad_test.py")).toBe(true);
    expect(shouldExcludeSkillFile("scripts/runner.test.ts")).toBe(true);
    expect(shouldExcludeSkillFile("scripts/runner.test.py")).toBe(true);
  });

  it("excludes root evals/ directory", () => {
    expect(shouldExcludeSkillFile("evals/benchmark.sh")).toBe(true);
    expect(shouldExcludeSkillFile("evals/sub/eval.json")).toBe(true);
  });

  it("does not exclude files in skill named 'tests' ancestor", () => {
    expect(shouldExcludeSkillFile("scripts/runner.sh")).toBe(false);
    expect(shouldExcludeSkillFile("SKILL.md")).toBe(false);
  });

  it("verifies safe binary signatures for PNG, JPG, and GIF", () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    expect(isSafeBinaryAsset(".png", pngBytes)).toBe(true);

    const fakePng = new Uint8Array([0x00, 0x01, 0x02]);
    expect(isSafeBinaryAsset(".png", fakePng)).toBe(false);

    const jpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    expect(isSafeBinaryAsset(".jpg", jpgBytes)).toBe(true);
    expect(isSafeBinaryAsset(".jpeg", jpgBytes)).toBe(true);

    const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    expect(isSafeBinaryAsset(".gif", gifBytes)).toBe(true);
  });

  it("identifies script files by extension, shebang, or executable bit", () => {
    expect(isScriptFile("run.py")).toBe(true);
    expect(isScriptFile("run.sh")).toBe(true);
    expect(isScriptFile("run.ts")).toBe(true);
    expect(isScriptFile("run.ps1")).toBe(true);
    expect(isScriptFile("run.rb")).toBe(true);
    expect(isScriptFile("run.php")).toBe(true);
    expect(isScriptFile("unknown", "#!/bin/bash\necho 1")).toBe(true);
    expect(isScriptFile("unknown", "plain text", 0o755)).toBe(true);
    expect(isScriptFile("README.md", "plain text", 0o644)).toBe(false);
  });
});
