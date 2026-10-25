/**
 * Security scanner and packager exclusion logic & binary validation.
 */
export declare const EXCLUDE_DIRS: Set<string>;
export declare const ROOT_EXCLUDE_DIRS: Set<string>;
export declare const EXCLUDE_FILES: Set<string>;
export declare const SCRIPT_EXTENSIONS: Set<string>;
export declare const SAFE_BINARY_SIGNATURES: Record<string, number[][]>;
/**
 * Checks whether a relative path in a skill folder should be excluded
 * from scanning and packaging. Matches scan_skill_security.py should_exclude_skill_file.
 */
export declare function shouldExcludeSkillFile(relativeFilePath: string): boolean;
/**
 * Verifies if binary data matches known safe media magic bytes.
 */
export declare function isSafeBinaryAsset(ext: string, data: Uint8Array): boolean;
/**
 * Determines whether a file is an executable or script based on extension,
 * shebang line, or file permission mode.
 */
export declare function isScriptFile(fileName: string, content?: string, mode?: number): boolean;
