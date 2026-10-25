/**
 * Sanitizes filesystem paths for diagnostic reporting:
 * - If targetPath is within baseDir, returns relative path (or "." if identical).
 * - If outside baseDir or cannot be resolved, strips any personal user directories.
 *
 * @param baseDir Base reference directory (usually skill root or cwd).
 * @param targetPath Target absolute or relative file/directory path.
 * @returns Clean, sanitized relative or scrubbed path without user home leaks.
 */
export declare function sanitizeDiagnosticPath(baseDir: string, targetPath: string): string;
/**
 * Extracts a stable error code from a filesystem error without leaking
 * system paths embedded in err.message or err.toString().
 *
 * @param err Any caught error or exception from filesystem operations.
 * @returns Stable error code (e.g. EACCES, ENOENT, EISDIR) or fallback READ_ERROR.
 */
export declare function sanitizeFsError(err: unknown): string;
