/**
 * Specialized analyzers for Whitespace Padding, Steganography, Supply Chain,
 * Language Deserialization, AST Behavioral Sinks, and MCP Least Privilege.
 */
import { SecurityFinding } from "./security-types";
export declare const ZERO_WIDTH_CHARS: Set<string>;
export declare function isDependencyManifest(filePath: string): boolean;
/**
 * P9: Whitespace padding and steganography analysis.
 */
export declare function analyzeWhitespacePadding(content: string, filename: string): SecurityFinding[];
/**
 * SC1: Supply chain unpinned dependencies in requirements.txt.
 */
export declare function checkSupplyChainDependencies(content: string, fileRel: string): SecurityFinding[];
/**
 * DS1-DS4: Language-specific deserialization checks.
 */
export declare function checkLanguageDeserialization(content: string, fileRel: string): SecurityFinding[];
/**
 * AST1-AST10: Behavioral code sinks and dangerous patterns.
 */
export declare function analyzeBehavioralSinks(content: string, filename: string, isScript: boolean): SecurityFinding[];
/**
 * LP2: MCP Least Privilege wildcard checks on frontmatter.
 */
export declare function checkLeastPrivilegeFrontmatter(manifest: Record<string, unknown> | null | undefined, fileName: string): SecurityFinding[];
