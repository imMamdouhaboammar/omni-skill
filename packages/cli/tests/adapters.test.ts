import { describe, expect, it } from "bun:test";
import { generateAdapter } from "../src/core/adapters";
import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SkillManifest } from "../src/core/types";

describe("generateAdapter", () => {
  const dummyManifest: SkillManifest = {
    name: "test-adapter-skill",
    frontmatter: { name: "test-adapter-skill", description: "A skill for testing adapters." },
    content: "# Test Skill\nInstructions here.",
    lineCount: 5,
    hasReferences: false,
    hasScripts: false,
    hasEvals: false
  };

  it("should generate ChatGPT/Codex plugin", () => {
    const dir = mkdtempSync(join(tmpdir(), "adapter-test-"));
    const res = generateAdapter(dummyManifest, "chatgpt", dir);
    expect(existsSync(join(dir, ".codex-plugin", "plugin.json"))).toBe(true);
    expect(res.filesGenerated.length).toBeGreaterThan(0);
  });

  it("should generate Claude Code plugin", () => {
    const dir = mkdtempSync(join(tmpdir(), "adapter-test-"));
    const res = generateAdapter(dummyManifest, "claude", dir);
    expect(existsSync(join(dir, ".claude-plugin", "plugin.json"))).toBe(true);
    expect(existsSync(join(dir, ".claude-plugin", "marketplace.json"))).toBe(true);
  });

  it("should generate Cursor .cursorrules", () => {
    const dir = mkdtempSync(join(tmpdir(), "adapter-test-"));
    const res = generateAdapter(dummyManifest, "cursor", dir);
    expect(existsSync(join(dir, ".cursorrules"))).toBe(true);
  });

  it("should generate Antigravity plugin", () => {
    const dir = mkdtempSync(join(tmpdir(), "adapter-test-"));
    const res = generateAdapter(dummyManifest, "antigravity", dir);
    expect(existsSync(join(dir, ".gemini", "plugin.json"))).toBe(true);
  });

  it("should generate Windsurf rules", () => {
    const dir = mkdtempSync(join(tmpdir(), "adapter-test-"));
    const res = generateAdapter(dummyManifest, "windsurf", dir);
    expect(existsSync(join(dir, ".windsurfrules"))).toBe(true);
  });

  it("should generate Cline rules", () => {
    const dir = mkdtempSync(join(tmpdir(), "adapter-test-"));
    const res = generateAdapter(dummyManifest, "cline", dir);
    expect(existsSync(join(dir, ".clinerules"))).toBe(true);
  });

  it("should generate GitHub Copilot instructions", () => {
    const dir = mkdtempSync(join(tmpdir(), "adapter-test-"));
    const res = generateAdapter(dummyManifest, "copilot", dir);
    expect(existsSync(join(dir, ".github", "copilot-instructions.md"))).toBe(true);
  });
});
