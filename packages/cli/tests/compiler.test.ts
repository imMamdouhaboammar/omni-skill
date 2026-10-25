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

describe("compileOmniSkillSpec Reference Containment (#8)", () => {
  let rootDir: string;
  let outDir: string;
  let sentinelFile: string;
  let sentinelHash: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "omni-compiler-ref-containment-"));
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

  it("should compile valid reference keys into references/ directory", () => {
    const spec = {
      name: "valid-skill",
      description: "Skill with valid references",
      job: "Reference test",
      instructions: ["Step 1"],
      references: {
        "api-guide": "# API Guide\nValid content.",
        "schema-v1": "# Schema V1\nValid schema."
      }
    };

    const res = compileOmniSkillSpec(spec as any, outDir);
    const refDir = join(res, "references");
    expect(existsSync(join(refDir, "api-guide.md"))).toBe(true);
    expect(existsSync(join(refDir, "schema-v1.md"))).toBe(true);
    expect(readFileSync(join(refDir, "api-guide.md"), "utf-8")).toBe("# API Guide\nValid content.");
    expect(sha256(sentinelFile)).toBe(sentinelHash);
  });

  const adversarialRefCases = [
    { name: "parent traversal", payload: "../escaped-ref" },
    { name: "attempt overwrite SKILL.md", payload: "../../SKILL" },
    { name: "deep traversal", payload: "../../../outside-ref" },
    { name: "nested traversal", payload: "nested/../../escaped-child" },
    { name: "absolute unix path", payload: "/etc/passwd" },
    { name: "windows-style absolute path", payload: "C:\\evil\\target" },
    { name: "forward slash separator", payload: "sub/ref" },
    { name: "backward slash separator", payload: "sub\\ref" },
    { name: "dot segment", payload: "." },
    { name: "dot-dot segment", payload: ".." },
    { name: "hidden file dot prefix", payload: ".hidden" },
    { name: "file extension suffix .md", payload: "reference.md" },
    { name: "file extension suffix .json", payload: "reference.json" },
    { name: "empty key", payload: "" },
    { name: "whitespace key", payload: "   " },
    { name: "uppercase non-kebab key", payload: "ApiGuide" },
    { name: "special symbols in key", payload: "ref$name!" },
    { name: "underscore in key", payload: "api_guide" },
    { name: "trailing newline", payload: "api-guide\n" }
  ];

  for (const tc of adversarialRefCases) {
    it(`should reject adversarial reference key "${tc.name}" without writing outside references/`, () => {
      const spec = {
        name: "test-ref-skill",
        description: "Adversarial reference test",
        job: "Attempt ref escape",
        instructions: ["Step 1"],
        references: {
          [tc.payload]: "EVIL CONTENT"
        }
      };

      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow();

      // Sentinel must remain untouched
      expect(sha256(sentinelFile)).toBe(sentinelHash);

      // Verify no escaped files were created
      const skillPath = join(outDir, "test-ref-skill");
      expect(existsSync(join(rootDir, "escaped-ref.md"))).toBe(false);
      expect(existsSync(join(outDir, "escaped-ref.md"))).toBe(false);
      expect(existsSync(join(rootDir, "outside-ref.md"))).toBe(false);

      // Verify SKILL.md was not overwritten by evil content if skill dir exists
      if (existsSync(join(skillPath, "SKILL.md"))) {
        const skillMd = readFileSync(join(skillPath, "SKILL.md"), "utf-8");
        expect(skillMd).not.toContain("EVIL CONTENT");
      }
    });
  }

  it("should reject non-object references collections (array, string, number)", () => {
    for (const badRef of [["array-ref"], "string-ref", 12345, true]) {
      const spec = {
        name: "test-bad-refs",
        description: "Bad refs type",
        job: "Fail",
        instructions: ["Step 1"],
        references: badRef
      };

      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow();
    }
  });

  it("should enforce all-or-nothing validation: reject all if one reference key is adversarial", () => {
    const spec = {
      name: "all-or-nothing-skill",
      description: "Batch reference validation",
      job: "Fail atomically",
      instructions: ["Step 1"],
      references: {
        "valid-first": "# Valid First",
        "../evil-second": "EVIL",
        "valid-third": "# Valid Third"
      }
    };

    expect(() => {
      compileOmniSkillSpec(spec as any, outDir);
    }).toThrow();

    // Verify references/ directory does NOT exist or has 0 written files
    const skillPath = join(outDir, "all-or-nothing-skill");
    const refDir = join(skillPath, "references");
    if (existsSync(refDir)) {
      expect(existsSync(join(refDir, "valid-first.md"))).toBe(false);
      expect(existsSync(join(refDir, "valid-third.md"))).toBe(false);
    }
  });

  it("should reject pre-existing symlinks in references directory or reference target", () => {
    // 1. Symlinked references directory
    const symlinkSkillDir = join(outDir, "symlink-ref-skill");
    mkdirSync(symlinkSkillDir, { recursive: true });
    const outsideTarget = join(rootDir, "outside-ref-target");
    mkdirSync(outsideTarget, { recursive: true });
    symlinkSync(outsideTarget, join(symlinkSkillDir, "references"), "dir");

    const spec1 = {
      name: "symlink-ref-skill",
      description: "Symlink directory attack",
      job: "Fail on symlink refDir",
      instructions: ["Step 1"],
      references: {
        "normal-ref": "SYMLINK CONTENT"
      }
    };

    expect(() => {
      compileOmniSkillSpec(spec1 as any, outDir);
    }).toThrow(/symbolic link/);
    expect(sha256(sentinelFile)).toBe(sentinelHash);
    expect(existsSync(join(outsideTarget, "normal-ref.md"))).toBe(false);

    // 2. Symlinked target file in references
    const fileSymlinkSkill = join(outDir, "file-symlink-skill");
    const fileRefDir = join(fileSymlinkSkill, "references");
    mkdirSync(fileRefDir, { recursive: true });
    const outsideFile = join(rootDir, "outside-target.md");
    writeFileSync(outsideFile, "INITIAL_CONTENT", "utf-8");
    symlinkSync(outsideFile, join(fileRefDir, "attack.md"), "file");

    const spec2 = {
      name: "file-symlink-skill",
      description: "Symlink file attack",
      job: "Fail on symlink target file",
      instructions: ["Step 1"],
      references: {
        attack: "OVERWRITE VIA SYMLINK"
      }
    };

    expect(() => {
      compileOmniSkillSpec(spec2 as any, outDir);
    }).toThrow(/symbolic link/);
    expect(readFileSync(outsideFile, "utf-8")).toBe("INITIAL_CONTENT");
    expect(sha256(sentinelFile)).toBe(sentinelHash);
  });

  it("should reject non-plain-object references like Map or Set", () => {
    const specMap = {
      name: "map-ref-skill",
      description: "Map references",
      job: "Fail on Map",
      instructions: ["Step 1"],
      references: new Map([["api-guide", "Content"]])
    };

    expect(() => {
      compileOmniSkillSpec(specMap as any, outDir);
    }).toThrow(TypeError);

    const specSet = {
      name: "set-ref-skill",
      description: "Set references",
      job: "Fail on Set",
      instructions: ["Step 1"],
      references: new Set(["api-guide"])
    };

    expect(() => {
      compileOmniSkillSpec(specSet as any, outDir);
    }).toThrow(TypeError);
  });

  it("should safely snapshot references to prevent proxy/getter race condition", () => {
    let callCount = 0;
    const dynamicRefs = {
      get "api-guide"() {
        callCount++;
        return "Valid Content";
      }
    };

    const spec = {
      name: "proxy-ref-skill",
      description: "Dynamic references getter",
      job: "Snapshot test",
      instructions: ["Step 1"],
      references: dynamicRefs
    };

    const compiled = compileOmniSkillSpec(spec as any, outDir);
    expect(existsSync(join(compiled, "references", "api-guide.md"))).toBe(true);
    expect(readFileSync(join(compiled, "references", "api-guide.md"), "utf-8")).toBe("Valid Content");
  });
});

describe("compileOmniSkillSpec Spec Root Validation", () => {
  let rootDir: string;
  let outDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "omni-compiler-root-"));
    outDir = join(rootDir, "output");
    mkdirSync(outDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it("should reject non-object root spec (null, undefined, primitives, arrays)", () => {
    const invalidSpecs = [null, undefined, "string", 12345, true, false, []];
    for (const invalid of invalidSpecs) {
      expect(() => {
        compileOmniSkillSpec(invalid as any, outDir);
      }).toThrow(new TypeError("Skill specification must be an object."));
    }
  });
});

describe("compileOmniSkillSpec Description Validation", () => {
  let rootDir: string;
  let outDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "omni-compiler-desc-"));
    outDir = join(rootDir, "output");
    mkdirSync(outDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it("should reject missing or null description", () => {
    const missingSpecs = [
      { name: "test-skill", job: "Do work", instructions: ["Step 1"] },
      { name: "test-skill", description: null, job: "Do work", instructions: ["Step 1"] },
      { name: "test-skill", description: undefined, job: "Do work", instructions: ["Step 1"] }
    ];
    for (const spec of missingSpecs) {
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'description' must be a non-empty string/);
    }
  });

  it("should reject non-string description (number, boolean, array, object)", () => {
    const badTypeSpecs = [
      { name: "test-skill", description: 12345, job: "Do work", instructions: ["Step 1"] },
      { name: "test-skill", description: true, job: "Do work", instructions: ["Step 1"] },
      { name: "test-skill", description: ["array", "desc"], job: "Do work", instructions: ["Step 1"] },
      { name: "test-skill", description: { desc: "object" }, job: "Do work", instructions: ["Step 1"] }
    ];
    for (const spec of badTypeSpecs) {
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'description' must be a non-empty string/);
    }
  });

  it("should reject empty or whitespace-only description", () => {
    const emptySpecs = [
      { name: "test-skill", description: "", job: "Do work", instructions: ["Step 1"] },
      { name: "test-skill", description: "   ", job: "Do work", instructions: ["Step 1"] },
      { name: "test-skill", description: "\t\n  \r\n", job: "Do work", instructions: ["Step 1"] }
    ];
    for (const spec of emptySpecs) {
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'description' must be a non-empty string/);
    }
  });
});
