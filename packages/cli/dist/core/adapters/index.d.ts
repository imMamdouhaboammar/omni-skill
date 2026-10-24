import { SkillManifest } from "../types";
export interface AdapterResult {
    target: string;
    filesGenerated: string[];
    notes: string[];
}
export declare function generateAdapter(manifest: SkillManifest, target: string, outputDir: string): AdapterResult;
