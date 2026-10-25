/**
 * Inspects an explicit skill root path to verify it exists and is a readable directory.
 * Returns either ok: true with resolved paths or ok: false with structured failure diagnostics.
 */
export declare function inspectSkillRoot(rawPath: string): {
    ok: true;
    skillPath: string;
    safeDisplay: string;
} | {
    ok: false;
    code: string;
    message: string;
    safeDisplay: string;
};
/**
 * Executes skill validation across one or more target skill directories.
 * Conforms to fail-closed CLI requirements: exits 1 if any root is invalid,
 * unreadable, or contains validation errors.
 */
export declare function validateSkillCommand(pathArg: string | string[]): void;
