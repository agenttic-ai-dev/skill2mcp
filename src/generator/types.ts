import type { ParseDiagnostic, ParseMode } from "../ir/types.js";
import type { MCPToolDefinition } from "../transformer/types.js";

export type TransportMode = "stdio" | "http" | "both";

export interface BuildCommandOptions {
  mode: ParseMode;
  outDir: string;
  transport: TransportMode;
}

export interface BuildArtifact {
  path: string;
  content: string;
}

export interface BuildResult {
  tools: MCPToolDefinition[];
  diagnostics: ParseDiagnostic[];
  files: BuildArtifact[];
}
