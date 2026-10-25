/**
 * Security scanner and packager exclusion logic & binary validation.
 */

export const EXCLUDE_DIRS = new Set([
  ".git",
  "__pycache__",
  ".pytest_cache",
  "node_modules",
  "tests",
]);

export const ROOT_EXCLUDE_DIRS = new Set<string>();

export const EXCLUDE_FILES = new Set([".DS_Store", "conftest.py"]);

export const SCRIPT_EXTENSIONS = new Set([
  ".py",
  ".sh",
  ".bash",
  ".zsh",
  ".ksh",
  ".fish",
  ".ps1",
  ".bat",
  ".cmd",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".rb",
  ".rake",
  ".php",
  ".phtml",
]);

export const SAFE_BINARY_SIGNATURES: Record<string, number[][]> = {
  ".png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  ".jpg": [[0xff, 0xd8, 0xff]],
  ".jpeg": [[0xff, 0xd8, 0xff]],
  ".gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  ".webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF
  ".ico": [[0x00, 0x00, 0x01, 0x00]],
  ".woff": [[0x77, 0x4f, 0x46, 0x46]], // wOFF
  ".woff2": [[0x77, 0x4f, 0x46, 0x32]], // wOF2
  ".ttf": [[0x00, 0x01, 0x00, 0x00]],
  ".otf": [[0x4f, 0x54, 0x54, 0x4f]], // OTTO
};

/**
 * Checks whether a relative path in a skill folder should be excluded
 * from scanning and packaging. Matches scan_skill_security.py should_exclude_skill_file.
 */
export function shouldExcludeSkillFile(relativeFilePath: string): boolean {
  const normalized = relativeFilePath.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length === 0) return true;

  // Check if any ancestor directory matches EXCLUDE_DIRS
  for (let i = 0; i < parts.length - 1; i++) {
    if (EXCLUDE_DIRS.has(parts[i])) {
      return true;
    }
  }

  // Check if root directory matches ROOT_EXCLUDE_DIRS (e.g. evals/)
  if (parts.length > 1 && ROOT_EXCLUDE_DIRS.has(parts[0])) {
    return true;
  }

  const fileName = parts[parts.length - 1];
  if (EXCLUDE_FILES.has(fileName)) {
    return true;
  }

  if (
    fileName.startsWith(".") ||
    fileName.startsWith("test_") ||
    fileName.endsWith("_test.py") ||
    fileName.endsWith(".test.ts") ||
    fileName.endsWith(".test.py") ||
    fileName.endsWith(".pyc")
  ) {
    return true;
  }

  return false;
}

/**
 * Verifies if binary data matches known safe media magic bytes.
 */
export function isSafeBinaryAsset(ext: string, data: Uint8Array): boolean {
  const lowerExt = ext.toLowerCase();
  const signatures = SAFE_BINARY_SIGNATURES[lowerExt];
  if (!signatures) return false;

  for (const sig of signatures) {
    if (data.length >= sig.length) {
      let matches = true;
      for (let i = 0; i < sig.length; i++) {
        if (data[i] !== sig[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
  }
  return false;
}

/**
 * Determines whether a file is an executable or script based on extension,
 * shebang line, or file permission mode.
 */
export function isScriptFile(fileName: string, content?: string, mode?: number): boolean {
  const dotIndex = fileName.lastIndexOf(".");
  const ext = dotIndex !== -1 ? fileName.slice(dotIndex).toLowerCase() : "";
  if (SCRIPT_EXTENSIONS.has(ext)) {
    return true;
  }
  if (content && content.startsWith("#!")) {
    return true;
  }
  if (typeof mode === "number" && (mode & 0o111) !== 0) {
    return true;
  }
  return false;
}
