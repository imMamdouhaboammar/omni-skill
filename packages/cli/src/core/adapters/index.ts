import { SkillManifest } from "../types";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export interface AdapterResult {
  target: string;
  filesGenerated: string[];
  notes: string[];
}

export function generateAdapter(manifest: SkillManifest, target: string, outputDir: string): AdapterResult {
  const t = target.toLowerCase();
  const filesGenerated: string[] = [];
  const notes: string[] = [];

  switch (t) {
    case "chatgpt":
    case "codex": {
      const pluginDir = join(outputDir, ".codex-plugin");
      mkdirSync(pluginDir, { recursive: true });
      const manifestPath = join(pluginDir, "plugin.json");
      const data = {
        name: manifest.name,
        version: "5.0.0",
        description: manifest.frontmatter.description,
        skills: "./skills/",
        interface: {
          displayName: manifest.name.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          shortDescription: manifest.frontmatter.description.slice(0, 80),
          category: "Developer Tools"
        }
      };
      writeFileSync(manifestPath, JSON.stringify(data, null, 2), "utf-8");
      filesGenerated.push(manifestPath);
      notes.push("Generated .codex-plugin/plugin.json for OpenAI ChatGPT & Codex Plugins");
      break;
    }

    case "claude":
    case "claude-code": {
      const claudeDir = join(outputDir, ".claude-plugin");
      mkdirSync(claudeDir, { recursive: true });
      const pluginJson = join(claudeDir, "plugin.json");
      const marketJson = join(claudeDir, "marketplace.json");
      writeFileSync(pluginJson, JSON.stringify({
        name: manifest.name,
        version: "5.0.0",
        description: manifest.frontmatter.description,
        license: "MIT"
      }, null, 2), "utf-8");
      writeFileSync(marketJson, JSON.stringify({
        name: manifest.name,
        version: "5.0.0",
        skills: "./skills/"
      }, null, 2), "utf-8");
      filesGenerated.push(pluginJson, marketJson);
      notes.push("Generated Claude Code plugin & marketplace descriptors");
      break;
    }

    case "antigravity":
    case "gemini": {
      const geminiDir = join(outputDir, ".gemini");
      mkdirSync(geminiDir, { recursive: true });
      const pluginDesc = join(geminiDir, "plugin.json");
      writeFileSync(pluginDesc, JSON.stringify({
        name: manifest.name,
        version: "5.0.0",
        type: "antigravity-skill-plugin",
        entry: manifest.name
      }, null, 2), "utf-8");
      filesGenerated.push(pluginDesc);
      notes.push("Generated Google Antigravity & Gemini CLI plugin configuration");
      break;
    }

    case "cursor": {
      const cursorRulesPath = join(outputDir, ".cursorrules");
      const ruleContent = `# Cursor Rules for ${manifest.name}
${manifest.frontmatter.description}

## Invariant Guidelines
${manifest.content}
`;
      writeFileSync(cursorRulesPath, ruleContent, "utf-8");
      filesGenerated.push(cursorRulesPath);
      notes.push("Generated .cursorrules for Cursor IDE integration");
      break;
    }

    case "windsurf": {
      const windsurfPath = join(outputDir, ".windsurfrules");
      writeFileSync(windsurfPath, `# Windsurf Rules for ${manifest.name}\n${manifest.frontmatter.description}\n\n${manifest.content}`, "utf-8");
      filesGenerated.push(windsurfPath);
      notes.push("Generated .windsurfrules for Codeium Windsurf IDE");
      break;
    }

    case "cline":
    case "roo": {
      const clineRulesPath = join(outputDir, ".clinerules");
      writeFileSync(clineRulesPath, `# Cline / Roo Code Rules for ${manifest.name}\n${manifest.frontmatter.description}\n\n${manifest.content}`, "utf-8");
      filesGenerated.push(clineRulesPath);
      notes.push("Generated .clinerules for Cline & Roo Code agents");
      break;
    }

    case "copilot": {
      const ghDir = join(outputDir, ".github");
      mkdirSync(ghDir, { recursive: true });
      const copilotPath = join(ghDir, "copilot-instructions.md");
      writeFileSync(copilotPath, `# GitHub Copilot Instructions for ${manifest.name}\n${manifest.frontmatter.description}\n\n${manifest.content}`, "utf-8");
      filesGenerated.push(copilotPath);
      notes.push("Generated .github/copilot-instructions.md for GitHub Copilot Workspace");
      break;
    }

    case "opencode": {
      const opencodeDir = join(outputDir, ".opencode");
      mkdirSync(opencodeDir, { recursive: true });
      const confPath = join(opencodeDir, "skill.json");
      writeFileSync(confPath, JSON.stringify({
        name: manifest.name,
        description: manifest.frontmatter.description,
        engine: "omni-skill-v5"
      }, null, 2), "utf-8");
      filesGenerated.push(confPath);
      notes.push("Generated OpenCode / DeepSeek Harness adapter configuration");
      break;
    }

    default: {
      const agentsDir = join(outputDir, ".agents", "plugins");
      mkdirSync(agentsDir, { recursive: true });
      const marketPath = join(agentsDir, "marketplace.json");
      writeFileSync(marketPath, JSON.stringify({
        name: manifest.name,
        interface: { displayName: manifest.name }
      }, null, 2), "utf-8");
      filesGenerated.push(marketPath);
      notes.push("Generated generic Agent Skills marketplace descriptor");
      break;
    }
  }

  return { target: t, filesGenerated, notes };
}
