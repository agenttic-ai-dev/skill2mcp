import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildProject } from "../src/generator/build-project.js";

describe("buildProject", () => {
  it("generates deployable MCP package artifacts", async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), "skill2mcp-build-"));
    const fixturesPath = path.resolve("fixtures/skills");

    const result = await buildProject(fixturesPath, {
      mode: "tolerant",
      outDir: tmp,
      transport: "both",
    });

    if ("error" in result) {
      throw new Error(result.error);
    }

    expect(result.tools.length).toBeGreaterThan(0);

    const serverSource = await readFile(path.join(tmp, "src/server.ts"), "utf8");
    const toolsJson = await readFile(path.join(tmp, "tools.json"), "utf8");
    const handlersIndex = await readFile(path.join(tmp, "src/handlers/index.ts"), "utf8");

    expect(serverSource).toContain("McpServer");
    expect(serverSource).toContain("StreamableHTTPServerTransport");
    expect(serverSource).toContain("StdioServerTransport");
    expect(toolsJson).toContain("docx-generator");
    expect(handlersIndex).toContain("docx-generator");
  });

  it("fails in strict mode when parser or validator emits errors", async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), "skill2mcp-build-strict-"));
    const ambiguousSkill = path.resolve("fixtures/skills/ambiguous-skill.md");

    const result = await buildProject(ambiguousSkill, {
      mode: "strict",
      outDir: tmp,
      transport: "both",
    });

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.diagnostics.length).toBeGreaterThan(0);
    }
  });
});
