import type { SkillDocument } from "../ir/types.js";
import type { MCPToolDefinition, ToolMappingResult } from "./types.js";
import { buildInputSchema } from "./schema-builder.js";
import { validateToolDefinition } from "./tool-validator.js";

function normalizeToolName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function mapSkillToTool(document: SkillDocument): ToolMappingResult {
  const fallbackName = document.path.split("/").pop()?.replace(/\.md$/i, "") ?? "skill-tool";

  const tool: MCPToolDefinition = {
    name: normalizeToolName(document.meta.name || fallbackName),
    description: document.meta.description || `Tool generated from ${fallbackName}.`,
    inputSchema: buildInputSchema(document.parameters),
  };

  return {
    tool,
    diagnostics: validateToolDefinition(tool, document.path),
  };
}
