import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseInputPath } from "../src/parser/parse-input.js";
import { buildInputSchema } from "../src/transformer/schema-builder.js";
import { mapSkillToTool } from "../src/transformer/tool-mapper.js";

const fixturesDir = path.resolve("fixtures/skills");

describe("schema-builder", () => {
  it("maps primitive and complex parameter types to JSON schema", () => {
    const schema = buildInputSchema([
      { name: "title", type: "string", required: true, description: "title" },
      { name: "count", type: "number", required: false, defaultValue: "10", description: "count" },
      { name: "active", type: "boolean", required: false, defaultValue: "true", description: "active" },
      { name: "mode", type: "enum[fast|safe]", required: true, description: "mode" },
      { name: "tags", type: "array<string>", required: false, description: "tags" },
    ]);

    expect(schema.type).toBe("object");
    expect(schema.properties?.count?.type).toBe("number");
    expect(schema.properties?.count?.default).toBe(10);
    expect(schema.properties?.active?.type).toBe("boolean");
    expect(schema.properties?.active?.default).toBe(true);
    expect(schema.properties?.mode?.enum).toEqual(["fast", "safe"]);
    expect(schema.properties?.tags?.type).toBe("array");
    expect(schema.required).toEqual(["title", "mode"]);
  });
});

describe("tool-mapper", () => {
  it("maps parsed skill to MCP tool definition", async () => {
    const parsed = await parseInputPath(path.join(fixturesDir, "valid-skill.md"), "strict");
    if ("error" in parsed) {
      throw new Error(parsed.error);
    }

    const mapped = mapSkillToTool(parsed.results[0].document);

    expect(mapped.tool.name).toBe("docx-generator");
    expect(mapped.tool.inputSchema.type).toBe("object");
    expect(mapped.tool.inputSchema.required).toEqual(["content", "title"]);
    expect(mapped.diagnostics).toHaveLength(0);
  });
});
