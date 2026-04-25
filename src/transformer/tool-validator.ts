import type { MCPToolDefinition, ToolValidationIssue } from "./types.js";

export function validateToolDefinition(tool: MCPToolDefinition, filePath: string): ToolValidationIssue[] {
  const issues: ToolValidationIssue[] = [];

  if (!tool.name || tool.name.length < 3) {
    issues.push({
      level: "error",
      code: "TOOL_NAME_INVALID",
      message: "Tool name is missing or too short.",
      file: filePath,
      section: "tool",
      hint: "Provide a stable snake/kebab style name with at least 3 characters.",
    });
  }

  if (!tool.description || tool.description.trim().length === 0) {
    issues.push({
      level: "error",
      code: "TOOL_DESCRIPTION_MISSING",
      message: "Tool description is required.",
      file: filePath,
      section: "tool",
      hint: "Add a non-empty description in frontmatter.",
    });
  }

  if (tool.inputSchema.type !== "object") {
    issues.push({
      level: "error",
      code: "TOOL_SCHEMA_INVALID_ROOT",
      message: "Input schema root type must be object.",
      file: filePath,
      section: "tool",
      hint: "Ensure SchemaBuilder always emits an object root.",
    });
  }

  return issues;
}
