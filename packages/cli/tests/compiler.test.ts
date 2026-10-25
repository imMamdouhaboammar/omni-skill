import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { compileOmniSkillSpec } from "../src/core/compiler";
import {
  mkdtempSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  symlinkSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

function sha256(filePath: string): string {
  const data = readFileSync(filePath);
  return createHash("sha256").update(data).digest("hex");
}

describe("compileOmniSkillSpec Path Containment (#7)", () => {
  let rootDir: string;
  let outDir: string;
  let sentinelFile: string;
  let sentinelHash: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "omni-compiler-containment-"));
    outDir = join(rootDir, "output");
    mkdirSync(outDir, { recursive: true });

    sentinelFile = join(rootDir, "sentinel.txt");
    writeFileSync(sentinelFile, "TOP-SECRET-SENTINEL-DATA", "utf-8");
    sentinelHash = sha256(sentinelFile);
  });

  afterEach(() => {
    if (existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it("should compile a valid portable skill spec into the output directory", () => {
    const spec = {
      name: "valid-skill",
      description: "Auto generated skill description",
      job: "Does tasks automatically",
      instructions: ["Check environment", "Run action"],
      references: { "api-guide": "# API Guide\nDetails here." }
    };

    const res = compileOmniSkillSpec(spec as any, outDir);
    expect(res).toBe(join(outDir, "valid-skill"));
    expect(existsSync(join(res, "SKILL.md"))).toBe(true);
    expect(existsSync(join(res, "references", "api-guide.md"))).toBe(true);
    expect(sha256(sentinelFile)).toBe(sentinelHash);
  });

  const adversarialCases = [
    { name: "parent traversal", payload: "../escaped-skill" },
    { name: "direct dot-dot", payload: ".." },
    { name: "deep traversal", payload: "../../../outside-skill" },
    { name: "nested traversal", payload: "nested/../../escaped-child" },
    { name: "absolute unix path", payload: "/tmp/evil-root-skill" },
    { name: "absolute-looking path", payload: "/etc/cron.d/malicious" },
    { name: "windows-style absolute path", payload: "C:\\windows\\system32\\evil" },
    { name: "forward slash separator", payload: "sub/dir" },
    { name: "backward slash separator", payload: "sub\\dir" },
    { name: "empty name", payload: "" },
    { name: "whitespace name", payload: "   " },
    { name: "non-kebab uppercase name", payload: "EvilSkill" },
    { name: "special symbols in name", payload: "bad$name!" },
    { name: "null name", payload: null },
    { name: "undefined name", payload: undefined },
    { name: "number name", payload: 12345 },
    { name: "boolean name", payload: false },
    { name: "array name", payload: ["escaped"] },
    { name: "object name", payload: { evil: "path" } }
  ];

  for (const tc of adversarialCases) {
    it(`should reject adversarial name "${tc.name}" without writing outside output directory`, () => {
      const spec = {
        name: tc.payload,
        description: "Adversarial test description",
        job: "Attempt escape",
        instructions: ["Step 1"]
      };

      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow();

      // Verify sentinel remains untouched
      expect(sha256(sentinelFile)).toBe(sentinelHash);

      // Verify no unexpected files were created outside outDir
      expect(existsSync(join(rootDir, "escaped-skill"))).toBe(false);
      expect(existsSync(join(rootDir, "SKILL.md"))).toBe(false);
      expect(existsSync(join(rootDir, "escaped-child"))).toBe(false);
    });
  }

  it("should prevent symlink escape when output directory is a symlink", () => {
    const realDir = join(rootDir, "real-target");
    mkdirSync(realDir, { recursive: true });
    const symlinkDir = join(rootDir, "symlink-out");
    symlinkSync(realDir, symlinkDir);

    const spec = {
      name: "../symlink-escape",
      description: "Escape via symlink target",
      job: "Test symlink containment",
      instructions: ["Step 1"]
    };

    expect(() => {
      compileOmniSkillSpec(spec as any, symlinkDir);
    }).toThrow();

    expect(existsSync(join(rootDir, "symlink-escape"))).toBe(false);
    expect(sha256(sentinelFile)).toBe(sentinelHash);
  });
});
