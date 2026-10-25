import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { compileOmniSkillSpec } from "../src/core/compiler";
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
    { name: "consecutive hyphens", payload: "bad--name" },
    { name: "leading hyphen", payload: "-bad-name" },
    { name: "trailing hyphen", payload: "bad-name-" },
    { name: "trailing newline in name", payload: "bad-name\n" },
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
    { name: "consecutive hyphens in key", payload: "bad--ref" },
    { name: "leading hyphen in key", payload: "-bad-ref" },
    { name: "trailing hyphen in key", payload: "bad-ref-" },
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

describe("compileOmniSkillSpec Job Validation", () => {
  let rootDir: string;
  let outDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "omni-compiler-job-"));
    outDir = join(rootDir, "output");
    mkdirSync(outDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it("should reject missing or null job", () => {
    const missingSpecs = [
      { name: "test-skill", description: "Valid desc", instructions: ["Step 1"] },
      { name: "test-skill", description: "Valid desc", job: null, instructions: ["Step 1"] },
      { name: "test-skill", description: "Valid desc", job: undefined, instructions: ["Step 1"] }
    ];
    for (const spec of missingSpecs) {
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'job' must be a non-empty string/);
    }
  });

  it("should reject non-string job (number, boolean, array, object)", () => {
    const badTypeSpecs = [
      { name: "test-skill", description: "Valid desc", job: 12345, instructions: ["Step 1"] },
      { name: "test-skill", description: "Valid desc", job: true, instructions: ["Step 1"] },
      { name: "test-skill", description: "Valid desc", job: ["array", "job"], instructions: ["Step 1"] },
      { name: "test-skill", description: "Valid desc", job: { task: "job" }, instructions: ["Step 1"] }
    ];
    for (const spec of badTypeSpecs) {
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'job' must be a non-empty string/);
    }
  });

  it("should reject empty or whitespace-only job", () => {
    const emptySpecs = [
      { name: "test-skill", description: "Valid desc", job: "", instructions: ["Step 1"] },
      { name: "test-skill", description: "Valid desc", job: "   ", instructions: ["Step 1"] },
      { name: "test-skill", description: "Valid desc", job: "\r\n  \t", instructions: ["Step 1"] }
    ];
    for (const spec of emptySpecs) {
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'job' must be a non-empty string/);
    }
  });
});

describe("compileOmniSkillSpec Instructions Validation", () => {
  let rootDir: string;
  let outDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "omni-compiler-inst-"));
    outDir = join(rootDir, "output");
    mkdirSync(outDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it("should reject missing or null instructions", () => {
    const missingSpecs = [
      { name: "test-skill", description: "Valid desc", job: "Valid job" },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: null },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: undefined }
    ];
    for (const spec of missingSpecs) {
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'instructions' must be a non-empty array of non-empty strings/);
    }
  });

  it("should reject non-array instructions (string, number, boolean, object)", () => {
    const badTypeSpecs = [
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: "Do step 1" },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: 12345 },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: true },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: { step: 1 } }
    ];
    for (const spec of badTypeSpecs) {
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'instructions' must be a non-empty array of non-empty strings/);
    }
  });

  it("should reject empty instructions array", () => {
    const spec = { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: [] };
    expect(() => {
      compileOmniSkillSpec(spec as any, outDir);
    }).toThrow(/Field 'instructions' must be a non-empty array of non-empty strings/);
  });

  it("should reject non-string elements in instructions array", () => {
    const badElementSpecs = [
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: [123] },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["Step 1", null] },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["Step 1", false] },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["Step 1", { step: 2 }] }
    ];
    for (const spec of badElementSpecs) {
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'instructions\[\d+\]' must be a non-empty string/);
    }
  });

  it("should reject empty or whitespace string elements in instructions array", () => {
    const emptyElementSpecs = [
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: [""] },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["Step 1", "   "] },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["\t\n  \r\n"] }
    ];
    for (const spec of emptyElementSpecs) {
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'instructions\[\d+\]' must be a non-empty string/);
    }
  });
});

describe("compileOmniSkillSpec Target Hosts Validation", () => {
  let rootDir: string;
  let outDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "omni-compiler-hosts-"));
    outDir = join(rootDir, "output");
    mkdirSync(outDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it("should reject non-array target_hosts (string, number, boolean, object)", () => {
    const badTypeSpecs = [
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["Step 1"], target_hosts: "chatgpt" },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["Step 1"], target_hosts: 12345 },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["Step 1"], target_hosts: true },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["Step 1"], target_hosts: { host: "codex" } }
    ];
    for (const spec of badTypeSpecs) {
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'target_hosts' must be an array of non-empty strings/);
    }
  });

  it("should reject non-string elements in target_hosts", () => {
    const badElementSpecs = [
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["Step 1"], target_hosts: [123] },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["Step 1"], target_hosts: ["chatgpt", null] },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["Step 1"], target_hosts: ["chatgpt", false] },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["Step 1"], target_hosts: [{}] }
    ];
    for (const spec of badElementSpecs) {
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'target_hosts\[\d+\]' must be a non-empty string/);
    }
  });

  it("should reject empty or whitespace string elements in target_hosts", () => {
    const emptyElementSpecs = [
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["Step 1"], target_hosts: [""] },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["Step 1"], target_hosts: ["chatgpt", "   "] },
      { name: "test-skill", description: "Valid desc", job: "Valid job", instructions: ["Step 1"], target_hosts: ["\t\n  \r\n"] }
    ];
    for (const spec of emptyElementSpecs) {
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'target_hosts\[\d+\]' must be a non-empty string/);
    }
  });

  it("should accept valid target_hosts or omitted target_hosts", () => {
    const validSpec = {
      name: "test-skill-1",
      description: "Valid desc",
      job: "Valid job",
      instructions: ["Step 1"],
      target_hosts: ["chatgpt", "codex"]
    };
    const res1 = compileOmniSkillSpec(validSpec as any, outDir);
    expect(readFileSync(join(res1, "SKILL.md"), "utf-8")).toContain("- Target Hosts: chatgpt, codex");

    const omittedSpec = {
      name: "test-skill-2",
      description: "Valid desc",
      job: "Valid job",
      instructions: ["Step 1"]
    };
    const res2 = compileOmniSkillSpec(omittedSpec as any, outDir);
    expect(readFileSync(join(res2, "SKILL.md"), "utf-8")).toContain("- Target Hosts: agent-skills, chatgpt, codex, claude-code");
  });

  it("should fall back to default target_hosts when target_hosts is an empty array", () => {
    const emptyArraySpec = {
      name: "test-skill-empty-hosts",
      description: "Valid desc",
      job: "Valid job",
      instructions: ["Step 1"],
      target_hosts: []
    };
    const res = compileOmniSkillSpec(emptyArraySpec as any, outDir);
    expect(readFileSync(join(res, "SKILL.md"), "utf-8")).toContain("- Target Hosts: agent-skills, chatgpt, codex, claude-code");
  });
});

describe("compileOmniSkillSpec Freedom Level Validation", () => {
  let rootDir: string;
  let outDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "omni-compiler-freedom-"));
    outDir = join(rootDir, "output");
    mkdirSync(outDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it("should reject invalid freedom_level enum strings", () => {
    const invalidValues = ["extreme", "none", "HIGH", "low ", "medium\n", ""];
    for (const val of invalidValues) {
      const spec = {
        name: "test-skill",
        description: "Valid desc",
        job: "Valid job",
        instructions: ["Step 1"],
        freedom_level: val
      };
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'freedom_level' must be one of 'high', 'medium', 'low'/);
    }
  });

  it("should reject non-string freedom_level types (number, boolean, array, object)", () => {
    const invalidTypes = [12345, true, false, ["high"], { level: "high" }];
    for (const val of invalidTypes) {
      const spec = {
        name: "test-skill",
        description: "Valid desc",
        job: "Valid job",
        instructions: ["Step 1"],
        freedom_level: val
      };
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'freedom_level' must be one of 'high', 'medium', 'low'/);
    }
  });

  it("should accept valid freedom_level values ('high', 'medium', 'low', omitted, undefined, null)", () => {
    for (const val of ["high", "medium", "low"]) {
      const spec = {
        name: `test-skill-${val}`,
        description: "Valid desc",
        job: "Valid job",
        instructions: ["Step 1"],
        freedom_level: val
      };
      const res = compileOmniSkillSpec(spec as any, outDir);
      expect(readFileSync(join(res, "SKILL.md"), "utf-8")).toContain(`- Freedom Level: ${val}`);
    }

    const omittedSpec = {
      name: "test-skill-omitted",
      description: "Valid desc",
      job: "Valid job",
      instructions: ["Step 1"]
    };
    const resOmitted = compileOmniSkillSpec(omittedSpec as any, outDir);
    expect(readFileSync(join(resOmitted, "SKILL.md"), "utf-8")).toContain("- Freedom Level: medium");

    const nullSpec = {
      name: "test-skill-null",
      description: "Valid desc",
      job: "Valid job",
      instructions: ["Step 1"],
      freedom_level: null
    };
    const resNull = compileOmniSkillSpec(nullSpec as any, outDir);
    expect(readFileSync(join(resNull, "SKILL.md"), "utf-8")).toContain("- Freedom Level: medium");
  });
});

describe("compileOmniSkillSpec Reference Value Validation", () => {
  let rootDir: string;
  let outDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "omni-compiler-ref-vals-"));
    outDir = join(rootDir, "output");
    mkdirSync(outDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it("should reject non-string reference values (number, boolean, null, object, array)", () => {
    const invalidVals = [12345, true, false, null, { nested: "val" }, ["array", "val"]];
    for (const val of invalidVals) {
      const spec = {
        name: "test-skill",
        description: "Valid desc",
        job: "Valid job",
        instructions: ["Step 1"],
        references: {
          "api-guide": val
        }
      };
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'references\["api-guide"\]' must be a string/);
    }
  });

  it("should not create references directory when references object is empty", () => {
    const spec = {
      name: "empty-refs-skill",
      description: "Valid desc",
      job: "Valid job",
      instructions: ["Step 1"],
      references: {}
    };
    const res = compileOmniSkillSpec(spec as any, outDir);
    expect(existsSync(join(res, "references"))).toBe(false);
  });
});

describe("compileOmniSkillSpec Evals Validation", () => {
  let rootDir: string;
  let outDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "omni-compiler-evals-"));
    outDir = join(rootDir, "output");
    mkdirSync(outDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it("should reject non-array evals (string, number, boolean, object)", () => {
    const invalidEvals = ["invalid", 12345, true, { id: "case-1" }];
    for (const val of invalidEvals) {
      const spec = {
        name: "test-skill",
        description: "Valid desc",
        job: "Valid job",
        instructions: ["Step 1"],
        evals: val
      };
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'evals' must be an array/);
    }
  });

  it("should reject invalid eval item structure (non-object, missing/empty/non-string id, non-string description)", () => {
    const invalidItems = [
      "not-an-object",
      12345,
      null,
      [],
      { description: "Missing id", assertions: [{ pattern: "success" }] },
      { id: "", assertions: [{ pattern: "success" }] },
      { id: "   ", assertions: [{ pattern: "success" }] },
      { id: 123, assertions: [{ pattern: "success" }] },
      { id: "case-1", description: 12345, assertions: [{ pattern: "success" }] },
      { id: "case-1", description: ["array", "desc"], assertions: [{ pattern: "success" }] }
    ];

    for (const item of invalidItems) {
      const spec = {
        name: "test-skill",
        description: "Valid desc",
        job: "Valid job",
        instructions: ["Step 1"],
        evals: [item]
      };
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'evals\[\d+\]/);
    }
  });

  it("should reject invalid eval assertions (missing/non-array/empty assertions, non-object assertion, missing/empty/non-string pattern, non-boolean required)", () => {
    const invalidAssertionSuites = [
      { id: "c1" }, // missing assertions
      { id: "c1", assertions: null },
      { id: "c1", assertions: "not-an-array" },
      { id: "c1", assertions: [] }, // empty assertions
      { id: "c1", assertions: ["not-an-object"] },
      { id: "c1", assertions: [null] },
      { id: "c1", assertions: [{}] }, // missing pattern
      { id: "c1", assertions: [{ pattern: "" }] }, // empty pattern
      { id: "c1", assertions: [{ pattern: "   " }] }, // whitespace pattern
      { id: "c1", assertions: [{ pattern: 123 }] }, // non-string pattern
      { id: "c1", assertions: [{ pattern: "ok", required: "yes" }] }, // non-boolean required
      { id: "c1", assertions: [{ pattern: "ok", required: 1 }] } // non-boolean required
    ];

    for (const item of invalidAssertionSuites) {
      const spec = {
        name: "test-skill",
        description: "Valid desc",
        job: "Valid job",
        instructions: ["Step 1"],
        evals: [item]
      };
      expect(() => {
        compileOmniSkillSpec(spec as any, outDir);
      }).toThrow(/Field 'evals\[\d+\]\.assertions/);
    }
  });

  it("should accept valid evals structure and preserve all fields", () => {
    const spec = {
      name: "test-skill",
      description: "Valid desc",
      job: "Valid job",
      instructions: ["Step 1"],
      evals: [
        {
          id: "case-1",
          description: "Verify hello pattern",
          assertions: [
            { pattern: "hello", required: true },
            { pattern: "world", required: false }
          ]
        },
        {
          id: "case-2",
          assertions: [
            { pattern: "foo" }
          ]
        }
      ]
    };

    const res = compileOmniSkillSpec(spec as any, outDir);
    const evalsJsonPath = join(res, "evals", "evals.json");
    expect(existsSync(evalsJsonPath)).toBe(true);
    const parsed = JSON.parse(readFileSync(evalsJsonPath, "utf-8"));
    expect(parsed.evals).toHaveLength(2);
    expect(parsed.evals[0].id).toBe("case-1");
    expect(parsed.evals[0].assertions[0].required).toBe(true);
    expect(parsed.evals[1].id).toBe("case-2");
  });

  it("should not create evals directory when evals array is empty", () => {
    const spec = {
      name: "empty-evals-skill",
      description: "Valid desc",
      job: "Valid job",
      instructions: ["Step 1"],
      evals: []
    };
    const res = compileOmniSkillSpec(spec as any, outDir);
    expect(existsSync(join(res, "evals"))).toBe(false);
  });
});

describe("compileOmniSkillSpec Zero Filesystem Mutation on Validation Failure", () => {
  let rootDir: string;
  let outDir: string;
  let sentinelFile: string;
  let sentinelHash: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "omni-compiler-mutation-"));
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

  const failureScenarios = [
    { label: "missing description", spec: { name: "fail-skill", job: "Job", instructions: ["Step 1"] } },
    { label: "number description", spec: { name: "fail-skill", description: 12345, job: "Job", instructions: ["Step 1"] } },
    { label: "empty description", spec: { name: "fail-skill", description: "   ", job: "Job", instructions: ["Step 1"] } },
    { label: "missing job", spec: { name: "fail-skill", description: "Desc", instructions: ["Step 1"] } },
    { label: "number job", spec: { name: "fail-skill", description: "Desc", job: 12345, instructions: ["Step 1"] } },
    { label: "empty job", spec: { name: "fail-skill", description: "Desc", job: "", instructions: ["Step 1"] } },
    { label: "missing instructions", spec: { name: "fail-skill", description: "Desc", job: "Job" } },
    { label: "string instructions", spec: { name: "fail-skill", description: "Desc", job: "Job", instructions: "Not array" } },
    { label: "empty instructions", spec: { name: "fail-skill", description: "Desc", job: "Job", instructions: [] } },
    { label: "number in instructions", spec: { name: "fail-skill", description: "Desc", job: "Job", instructions: [123] } },
    { label: "empty step in instructions", spec: { name: "fail-skill", description: "Desc", job: "Job", instructions: [""] } },
    { label: "string target_hosts", spec: { name: "fail-skill", description: "Desc", job: "Job", instructions: ["Step 1"], target_hosts: "chatgpt" } },
    { label: "number in target_hosts", spec: { name: "fail-skill", description: "Desc", job: "Job", instructions: ["Step 1"], target_hosts: [123] } },
    { label: "invalid freedom_level", spec: { name: "fail-skill", description: "Desc", job: "Job", instructions: ["Step 1"], freedom_level: "extreme" } },
    { label: "adversarial reference key", spec: { name: "fail-skill", description: "Desc", job: "Job", instructions: ["Step 1"], references: { "../escape": "content" } } },
    { label: "number reference value", spec: { name: "fail-skill", description: "Desc", job: "Job", instructions: ["Step 1"], references: { "api-guide": 12345 } } },
    { label: "string evals", spec: { name: "fail-skill", description: "Desc", job: "Job", instructions: ["Step 1"], evals: "bad" } },
    { label: "eval item missing id", spec: { name: "fail-skill", description: "Desc", job: "Job", instructions: ["Step 1"], evals: [{ assertions: [{ pattern: "ok" }] }] } },
    { label: "eval assertion missing pattern", spec: { name: "fail-skill", description: "Desc", job: "Job", instructions: ["Step 1"], evals: [{ id: "c1", assertions: [{}] }] } },
    { label: "eval assertion non-bool required", spec: { name: "fail-skill", description: "Desc", job: "Job", instructions: ["Step 1"], evals: [{ id: "c1", assertions: [{ pattern: "ok", required: "yes" }] }] } }
  ];

  for (const tc of failureScenarios) {
    it(`should guarantee zero filesystem mutations for ${tc.label}`, () => {
      expect(() => {
        compileOmniSkillSpec(tc.spec as any, outDir);
      }).toThrow();

      // Assert target directory was never created
      expect(existsSync(join(outDir, "fail-skill"))).toBe(false);

      // Assert output directory remains completely empty
      expect(readdirSync(outDir)).toHaveLength(0);

      // Assert sentinel remains intact
      expect(sha256(sentinelFile)).toBe(sentinelHash);
    });
  }
});

describe("compileOmniSkillSpec Golden Spec Parity", () => {
  let rootDir: string;
  let outDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "omni-compiler-golden-"));
    outDir = join(rootDir, "output");
    mkdirSync(outDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it("should compile a full golden spec matching contract specifications", () => {
    const goldenSpec = {
      name: "golden-skill",
      description: "A comprehensive production-grade skill specification.",
      job: "Executes deterministic validation and compilation flows flawlessly.",
      target_hosts: ["chatgpt", "codex", "claude-code"],
      freedom_level: "low",
      instructions: [
        "Read input parameters carefully.",
        "Validate preconditions before mutation.",
        "Emit structured report."
      ],
      references: {
        "architecture-overview": "# Architecture\nLayered system contract.",
        "api-conventions": "# Conventions\nFollow semver and fail closed."
      },
      evals: [
        {
          id: "case-preflight-gate",
          description: "Verify preflight gates fail closed on malformed input",
          assertions: [
            { pattern: "FAIL_CLOSED", required: true },
            { pattern: "BYPASS_UNAUTHORIZED", required: false }
          ]
        },
        {
          id: "case-success-path",
          assertions: [
            { pattern: "COMPILED_SUCCESS", required: true }
          ]
        }
      ]
    };

    const targetDir = compileOmniSkillSpec(goldenSpec as any, outDir);
    expect(existsSync(targetDir)).toBe(true);

    const skillMd = readFileSync(join(targetDir, "SKILL.md"), "utf-8");
    expect(skillMd).toContain("name: golden-skill");
    expect(skillMd).toContain("A comprehensive production-grade skill specification.");
    expect(skillMd).toContain("# Golden Skill");
    expect(skillMd).toContain("> Executes deterministic validation and compilation flows flawlessly.");
    expect(skillMd).toContain("- Read input parameters carefully.");
    expect(skillMd).toContain("- Validate preconditions before mutation.");
    expect(skillMd).toContain("- Emit structured report.");
    expect(skillMd).toContain("- Target Hosts: chatgpt, codex, claude-code");
    expect(skillMd).toContain("- Freedom Level: low");

    const ref1 = readFileSync(join(targetDir, "references", "architecture-overview.md"), "utf-8");
    expect(ref1).toBe("# Architecture\nLayered system contract.");
    const ref2 = readFileSync(join(targetDir, "references", "api-conventions.md"), "utf-8");
    expect(ref2).toBe("# Conventions\nFollow semver and fail closed.");

    const evalsContent = JSON.parse(readFileSync(join(targetDir, "evals", "evals.json"), "utf-8"));
    expect(evalsContent.evals).toHaveLength(2);
    expect(evalsContent.evals[0].id).toBe("case-preflight-gate");
    expect(evalsContent.evals[0].description).toBe("Verify preflight gates fail closed on malformed input");
    expect(evalsContent.evals[0].assertions).toHaveLength(2);
    expect(evalsContent.evals[0].assertions[0].pattern).toBe("FAIL_CLOSED");
    expect(evalsContent.evals[0].assertions[0].required).toBe(true);
    expect(evalsContent.evals[1].id).toBe("case-success-path");
    expect(evalsContent.evals[1].description).toBeUndefined();
  });

  it("should compile a minimal valid spec with all optional fields omitted", () => {
    const minimalSpec = {
      name: "minimal-skill",
      description: "Minimal spec description.",
      job: "Performs minimum actions.",
      instructions: ["Step 1: Just run."]
    };

    const targetDir = compileOmniSkillSpec(minimalSpec as any, outDir);
    expect(existsSync(targetDir)).toBe(true);

    const skillMd = readFileSync(join(targetDir, "SKILL.md"), "utf-8");
    expect(skillMd).toContain("name: minimal-skill");
    expect(skillMd).toContain("- Target Hosts: agent-skills, chatgpt, codex, claude-code");
    expect(skillMd).toContain("- Freedom Level: medium");
    expect(existsSync(join(targetDir, "references"))).toBe(false);
    expect(existsSync(join(targetDir, "evals"))).toBe(false);
  });
});
