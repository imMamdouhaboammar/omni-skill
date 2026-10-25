import { relative } from "node:path";

const PERSONAL_PATH_REGEX = /(?:\/(?:Users|home)\/(?!(?:<[^>]+>|username|user))[a-zA-Z0-9_.-]+|[A-Za-z]:[/\\]+(?:Users|home)[/\\]+[^\s/\\]+)/g;

/**
 * Sanitizes filesystem paths for diagnostic reporting:
 * - If targetPath is within baseDir, returns relative path (or "." if identical).
 * - If outside baseDir or cannot be resolved, strips any personal user directories.
 */
export function sanitizeDiagnosticPath(baseDir: string, targetPath: string): string {
  if (!targetPath || targetPath.trim().length === 0) {
    return ".";
  }
  try {
    const rel = relative(baseDir, targetPath);
    if (!rel.startsWith("..") && !rel.startsWith("/")) {
      return rel || ".";
    }
  } catch {
    // ignore
  }
  return targetPath.replace(PERSONAL_PATH_REGEX, "<user>");
}

/**
 * Extracts a stable error code from a filesystem error without leaking
 * system paths embedded in err.message or err.toString().
 */
export function sanitizeFsError(err: unknown): string {
  if (!err) return "READ_ERROR";
  if (typeof err === "object") {
    const code = (err as any).code;
    if (typeof code === "string" && code.trim().length > 0) {
      return code.trim();
    }
  }
  return "READ_ERROR";
}
