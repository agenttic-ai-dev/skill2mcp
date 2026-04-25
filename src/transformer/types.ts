import type { ParseDiagnostic } from "../ir/types.js";

export interface JsonSchema {
  type?: "object" | "string" | "number" | "integer" | "boolean" | "array";
  enum?: string[];
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  description?: string;
  default?: string | number | boolean | null;
  additionalProperties?: boolean;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
}

export interface ToolValidationIssue extends ParseDiagnostic {}

export interface ToolMappingResult {
  tool: MCPToolDefinition;
  diagnostics: ToolValidationIssue[];
}
