import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

describe("published package entry point", () => {
  it("exports a usable library without invoking the CLI", () => {
    const packageDir = join(__dirname, "..");
    const metadata = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf-8"));
    const entry = pathToFileURL(join(packageDir, metadata.exports["."].import)).href;
    const script = `import { routeRequest, validateSkillDirectory } from ${JSON.stringify(entry)};
if (typeof validateSkillDirectory !== "function" || routeRequest("validate my skill").intent !== "VALIDATE") process.exit(2);
console.log("library entry OK");`;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf-8" });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("library entry OK");
  });

  it("exports diagnostic sanitizers from the library interface", async () => {
    const lib = await import("../src/lib");
    expect(typeof lib.sanitizeDiagnosticPath).toBe("function");
    expect(typeof lib.sanitizeFsError).toBe("function");
    expect(lib.sanitizeDiagnosticPath("/base", "/base/sub/doc.md")).toBe("sub/doc.md");
    expect(lib.sanitizeFsError({ code: "EACCES" })).toBe("EACCES");
  });

  it("exports security scanning engine and types from the library interface", async () => {
    const lib = await import("../src/lib");
    expect(typeof lib.scanSkillDirectory).toBe("function");
    expect(typeof lib.scanSkillText).toBe("function");
    expect(typeof lib.computeRiskScore).toBe("function");
    expect(typeof lib.formatSecurityReportTerminal).toBe("function");
    expect(typeof lib.formatSecurityReportJson).toBe("function");
    expect(typeof lib.formatSecurityReportSarif).toBe("function");
    expect(lib.PatternCategory.PROMPT_INJECTION).toBe("Prompt Injection");
  });
});
