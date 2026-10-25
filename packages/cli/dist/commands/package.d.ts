export declare function collectSkillFiles(skillDir: string, name: string): Record<string, Uint8Array>;
/**
 * Reopens and verifies the temporary archive structure and byte integrity.
 */
export declare function verifyArchiveIntegrity(archiveBytes: Uint8Array, skillPath: string, skillName: string): {
    ok: true;
} | {
    ok: false;
    reason: string;
};
export declare function packageSkillCommand(skillPathArg: string, options?: {
    out?: string;
}): void;
