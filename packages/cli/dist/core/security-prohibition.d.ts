/**
 * Defensive Prohibition Grammar Context Engine
 * Prevents false positives when security guidelines, negative constraints,
 * or invariant rules forbid an action.
 */
/**
 * Checks whether an identified match is governed by a defensive prohibition.
 * For example: 'Do NOT execute rm -rf /' or 'Never reveal system prompts'.
 */
export declare function isDirectlyProhibited(content: string, start: number, end: number): boolean;
