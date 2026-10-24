import { SkillFrontmatter, SkillManifest } from "./types";
export declare function parseSkillMarkdown(content: string): {
    frontmatter: SkillFrontmatter;
    body: string;
};
export declare function loadSkillDirectory(skillDir: string): SkillManifest;
