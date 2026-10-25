import { describe, expect, it } from "bun:test";
import { sanitizeDiagnosticPath, sanitizeFsError } from "../src/core/path-sanitizer";

describe("Diagnostic Path & Error Sanitizer", () => {
  it("normalizes nested paths relative to skill directory", () => {
    const skillDir = "/Users/testuser/projects/my-skill";
    const nested = "/Users/testuser/projects/my-skill/references/spec.md";
    expect(sanitizeDiagnosticPath(skillDir, nested)).toBe("references/spec.md");
  });

  it("returns dot for the skill root directory itself", () => {
    const skillDir = "/Users/testuser/projects/my-skill";
    expect(sanitizeDiagnosticPath(skillDir, skillDir)).toBe(".");
  });

  it("sanitizes user home directory when path is outside skill directory", () => {
    const skillDir = "/tmp/skill";
    const outside = "/Users/mamdouhaboammar/secret/file.txt";
    const sanitized = sanitizeDiagnosticPath(skillDir, outside);
    expect(sanitized).not.toContain("mamdouhaboammar");
    expect(sanitized).not.toContain("/Users/");
  });

  it("extracts clean error code from Node/Bun filesystem error without leaking paths", () => {
    const fakeErr = Object.assign(new Error("EACCES: permission denied, open '/Users/secret/file'"), {
      code: "EACCES",
      syscall: "open",
      path: "/Users/secret/file"
    });
    const result = sanitizeFsError(fakeErr);
    expect(result).toBe("EACCES");
    expect(result).not.toContain("/Users/");
  });

  it("falls back to generic error code if error has no code", () => {
    const fakeErr = new Error("Unknown disk failure");
    const result = sanitizeFsError(fakeErr);
    expect(result).toBe("READ_ERROR");
  });
});
