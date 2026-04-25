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
});
