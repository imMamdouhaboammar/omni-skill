import { ValidationResult } from "./types";
/**
 * 7-Pass Autonomous Skill Validator conforming to AgentSkills.io v1,
 * Poteto Engineering Principles, and Anti-Slop quality standards.
 *
 * Invariant Guarantees:
 * - Fail-Closed: Refuses invalid, unreadable, symlinked, or non-directory roots.
 * - Robust I/O: Catches read/traversal errors and yields structured READ_FAILURE findings.
 * - Sibling Continuity: Continues scanning independent sibling files after an entry failure.
 * - Diagnostic Hygiene: Strips absolute personal filesystem paths from finding messages.
 *
 * @param skillDir Absolute or relative path to the skill directory.
 * @param targets Target host environments for validation compatibility.
 * @returns Structured validation result including pass flag, error counts, and findings.
 */
export declare function validateSkillDirectory(skillDir: string, targets?: string[]): ValidationResult;
