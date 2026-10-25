import { describe, expect, it } from "bun:test";
import { sanitizeDiagnosticPath, sanitizeFsError } from "../src/core/path-sanitizer";

describe("sanitizeDiagnosticPath - Adversarial Edge Cases", () => {
  it("sanitizes Windows-style user profile path", () => {
    const winPath = "C:\\Users\\Administrator\\projects\\skill\\SKILL.md";
    const sanitized = sanitizeDiagnosticPath("C:\\projects\\skill", winPath);
    expect(sanitized).not.toContain("Administrator");
    expect(sanitized).toContain("<user>");
  });

  it("handles empty string gracefully", () => {
    expect(sanitizeDiagnosticPath("/some/dir", "")).toBe(".");
  });

  it("handles identical paths by returning dot", () => {
    expect(sanitizeDiagnosticPath("/var/data/skill", "/var/data/skill")).toBe(".");
  });

  it("preserves unicode and emoji in relative paths", () => {
    const base = "/data/skills";
    const target = "/data/skills/日本語/⚡️-doc.md";
    expect(sanitizeDiagnosticPath(base, target)).toBe("日本語/⚡️-doc.md");
  });

  it("handles relative path with traversal escaping base by stripping personal paths", () => {
    const base = "/home/developer/app";
    const target = "/home/developer/secret.env";
    const sanitized = sanitizeDiagnosticPath(base, target);
    expect(sanitized).not.toContain("developer");
  });
});
