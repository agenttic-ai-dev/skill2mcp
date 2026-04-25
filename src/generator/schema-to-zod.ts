import type { JsonSchema } from "../transformer/types.js";

export function jsonSchemaToZodCode(schema: JsonSchema): string {
  if (schema.enum && schema.enum.length > 0) {
    const values = schema.enum.map((value) => JSON.stringify(value)).join(", ");
    return `z.enum([${values}])`;
  }

  switch (schema.type) {
    case "number":
      return "z.number()";
    case "integer":
      return "z.number().int()";
    case "boolean":
      return "z.boolean()";
    case "array":
      return `z.array(${jsonSchemaToZodCode(schema.items ?? { type: "string" })})`;
    case "object":
      return "z.record(z.string(), z.unknown())";
    case "string":
    default:
      return "z.string()";
  }
}

export function jsonSchemaPropertiesToZodObject(schema: JsonSchema): string {
  const properties = schema.properties ?? {};
  const requiredSet = new Set(schema.required ?? []);

  const lines = Object.entries(properties).map(([name, propertySchema]) => {
    let expression = jsonSchemaToZodCode(propertySchema);

    if (propertySchema.description) {
      expression += `.describe(${JSON.stringify(propertySchema.description)})`;
    }

    if (!requiredSet.has(name)) {
      expression += ".optional()";
    }

    return `    ${JSON.stringify(name)}: ${expression}`;
  });

  return `{
${lines.join(",\n")}
  }`;
}
