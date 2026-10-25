import { SkillFrontmatter, SkillManifest } from "./types";
export declare class FrontmatterTypeError extends Error {
    code: string;
    constructor(message: string);
}
export declare function validateFrontmatterTypes(data: unknown): asserts data is SkillFrontmatter;
export declare function parseSkillMarkdown(content: string): {
    frontmatter: SkillFrontmatter;
    body: string;
};
export declare function loadSkillDirectory(skillDir: string): SkillManifest;
