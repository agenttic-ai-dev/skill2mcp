import type { SkillParameter } from "../ir/types.js";
import type { JsonSchema } from "./types.js";

function parsePrimitiveType(value: string): JsonSchema {
  const normalized = value.trim().toLowerCase();

  if (normalized.startsWith("enum[") && normalized.endsWith("]")) {
    const body = normalized.slice(5, -1).trim();
    const enumValues = body
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      type: "string",
      enum: enumValues,
    };
  }

  if (normalized.startsWith("array<") && normalized.endsWith(">")) {
    const itemType = normalized.slice(6, -1).trim();
    return {
      type: "array",
      items: parsePrimitiveType(itemType),
    };
  }

  switch (normalized) {
    case "string":
      return { type: "string" };
    case "number":
      return { type: "number" };
    case "integer":
    case "int":
      return { type: "integer" };
    case "boolean":
    case "bool":
      return { type: "boolean" };
    case "object":
    case "json":
      return { type: "object", additionalProperties: true };
    default:
      return { type: "string" };
  }
}

function castDefaultValue(type: JsonSchema["type"], value: string): string | number | boolean {
  if (type === "number" || type === "integer") {
    const asNumber = Number(value);
    return Number.isNaN(asNumber) ? value : asNumber;
  }

  if (type === "boolean") {
    const lowered = value.toLowerCase();
    if (lowered === "true") {
      return true;
    }
    if (lowered === "false") {
      return false;
    }
  }

  return value;
}

export function buildInputSchema(parameters: SkillParameter[]): JsonSchema {
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];

  for (const parameter of parameters) {
    const schema = parsePrimitiveType(parameter.type);
    schema.description = parameter.description;

    if (parameter.defaultValue !== undefined) {
      schema.default = castDefaultValue(schema.type, parameter.defaultValue);
    }

    properties[parameter.name] = schema;

    if (parameter.required) {
      required.push(parameter.name);
    }
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}
