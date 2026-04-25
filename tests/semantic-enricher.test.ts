import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ParseResult } from "../src/ir/types.js";
import { enrichParseResultWithSemanticFallback } from "../src/parser/semantic-enricher.js";

function makeResult(): ParseResult {
  return {
    document: {
      path: "/tmp/my-skill.md",
      meta: {
        name: "",
        description: "",
        tags: [],
      },
      parameters: [],
      examples: [],
      triggers: [],
      notes: "",
      raw: "# Skill\n\nSome ambiguous content",
    },
    diagnostics: [
      {
        level: "warning",
        code: "MISSING_SKILL_NAME",
        message: "missing name",
        file: "/tmp/my-skill.md",
      },
      {
        level: "warning",
        code: "MISSING_SKILL_DESCRIPTION",
        message: "missing description",
        file: "/tmp/my-skill.md",
      },
      {
        level: "warning",
        code: "MISSING_PARAMETERS",
        message: "missing parameters",
        file: "/tmp/my-skill.md",
      },
    ],
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_MODEL;
  delete process.env.SKILL2MCP_CACHE_DIR;
});

describe("semantic-enricher", () => {
  it("uses OpenRouter payload and stores cache", async () => {
    const cacheDir = await mkdtemp(path.join(os.tmpdir(), "skill2mcp-cache-"));
    process.env.SKILL2MCP_CACHE_DIR = cacheDir;
    process.env.OPENROUTER_API_KEY = "test-key";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: "semantic-name",
                description: "semantic-description",
                tags: ["genai"],
                parameters: [
                  {
                    name: "input",
                    type: "string",
                    required: true,
                    description: "input text",
                  },
                ],
              }),
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await enrichParseResultWithSemanticFallback(makeResult());

    expect(result.document.meta.name).toBe("semantic-name");
    expect(result.document.meta.description).toBe("semantic-description");
    expect(result.document.parameters).toHaveLength(1);
    expect(result.diagnostics.some((d) => d.code === "SEMANTIC_OPENROUTER_APPLIED")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses cache when available and avoids second network call", async () => {
    const cacheDir = await mkdtemp(path.join(os.tmpdir(), "skill2mcp-cache-"));
    process.env.SKILL2MCP_CACHE_DIR = cacheDir;
    process.env.OPENROUTER_API_KEY = "test-key";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: "cached-name",
                description: "cached-description",
                parameters: [
                  {
                    name: "query",
                    type: "string",
                    required: true,
                    description: "query",
                  },
                ],
              }),
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const first = await enrichParseResultWithSemanticFallback(makeResult());
    const second = await enrichParseResultWithSemanticFallback(makeResult());

    expect(first.document.meta.name).toBe("cached-name");
    expect(second.document.meta.name).toBe("cached-name");
    expect(second.diagnostics.some((d) => d.code === "SEMANTIC_OPENROUTER_CACHE_APPLIED")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
