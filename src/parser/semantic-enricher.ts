import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ParseDiagnostic, ParseResult, SkillParameter } from "../ir/types.js";

interface SemanticExtractionPayload {
  name?: string;
  description?: string;
  tags?: string[];
  parameters?: SkillParameter[];
}

interface CacheRecord {
  [contentHash: string]: SemanticExtractionPayload;
}

interface MissingFields {
  name: boolean;
  description: boolean;
  parameters: boolean;
}

function slugToName(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function removeResolvedWarnings(diagnostics: ParseDiagnostic[], result: ParseResult): ParseDiagnostic[] {
  return diagnostics.filter((diagnostic) => {
    if (diagnostic.code === "MISSING_SKILL_NAME" && result.document.meta.name) {
      return false;
    }
    if (diagnostic.code === "MISSING_SKILL_DESCRIPTION" && result.document.meta.description) {
      return false;
    }
    if (diagnostic.code === "MISSING_PARAMETERS" && result.document.parameters.length > 0) {
      return false;
    }
    return true;
  });
}

function normalizeParameters(payload: unknown): SkillParameter[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  const output: SkillParameter[] = [];

  for (const item of payload) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const source = item as Record<string, unknown>;
    const name = String(source.name ?? "").trim();
    if (!name) {
      continue;
    }

    output.push({
        name,
        type: String(source.type ?? "string").trim() || "string",
        required: Boolean(source.required),
        defaultValue: source.defaultValue === undefined ? undefined : String(source.defaultValue),
        description: String(source.description ?? "").trim(),
      });
  }

  return output;
}

function parseResponseJson(text: string): SemanticExtractionPayload | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    return {
      name: typeof parsed.name === "string" ? parsed.name.trim() : undefined,
      description: typeof parsed.description === "string" ? parsed.description.trim() : undefined,
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : undefined,
      parameters: normalizeParameters(parsed.parameters),
    };
  } catch {
    return null;
  }
}

function getMissingFields(result: ParseResult): MissingFields {
  return {
    name: !result.document.meta.name,
    description: !result.document.meta.description,
    parameters: result.document.parameters.length === 0,
  };
}

function cacheFilePath(): string {
  const explicitDir = process.env.SKILL2MCP_CACHE_DIR;
  const baseDir = explicitDir ? path.resolve(explicitDir) : path.resolve(process.cwd(), ".skill2mcp-cache");
  return path.join(baseDir, "semantic-openrouter-cache.json");
}

async function loadCache(): Promise<CacheRecord> {
  const file = cacheFilePath();

  try {
    const text = await readFile(file, "utf8");
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const output: CacheRecord = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") {
        continue;
      }
      output[key] = value as SemanticExtractionPayload;
    }

    return output;
  } catch {
    return {};
  }
}

async function writeCache(cache: CacheRecord): Promise<void> {
  const file = cacheFilePath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(cache, null, 2).concat("\n"), "utf8");
}

function computeHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function requestOpenRouterExtraction(
  rawSkill: string,
  missing: MissingFields,
): Promise<{ payload: SemanticExtractionPayload | null; source: "openrouter" | "cache" | "none" }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { payload: null, source: "none" };
  }

  const contentHash = computeHash(rawSkill);
  const cache = await loadCache();
  if (cache[contentHash]) {
    return { payload: cache[contentHash], source: "cache" };
  }

  const prompt = [
    "Extract missing SKILL metadata as strict JSON.",
    "Return only JSON with keys: name, description, tags, parameters.",
    "parameters must be array of objects with keys: name, type, required, defaultValue, description.",
    "Only infer fields requested below; unknown fields should be omitted.",
    `Missing fields: ${JSON.stringify(missing)}`,
    "",
    rawSkill,
  ].join("\n");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(process.env.OPENROUTER_HTTP_REFERER ? { "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER } : {}),
      ...(process.env.OPENROUTER_X_TITLE ? { "X-Title": process.env.OPENROUTER_X_TITLE } : {}),
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? "anthropic/claude-3.5-sonnet",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "You are a strict extractor. Output JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const text = data.choices?.[0]?.message?.content ?? "";
  const payload = parseResponseJson(text);

  if (payload) {
    cache[contentHash] = payload;
    await writeCache(cache);
  }

  return { payload, source: "openrouter" };
}

function applyExtraction(result: ParseResult, payload: SemanticExtractionPayload): boolean {
  let changed = false;

  if (!result.document.meta.name && payload.name) {
    result.document.meta.name = payload.name;
    changed = true;
  }

  if (!result.document.meta.description && payload.description) {
    result.document.meta.description = payload.description;
    changed = true;
  }

  if (result.document.meta.tags.length === 0 && payload.tags && payload.tags.length > 0) {
    result.document.meta.tags = payload.tags;
    changed = true;
  }

  if (result.document.parameters.length === 0 && payload.parameters && payload.parameters.length > 0) {
    result.document.parameters = payload.parameters;
    changed = true;
  }

  return changed;
}

export async function enrichParseResultWithSemanticFallback(result: ParseResult): Promise<ParseResult> {
  const diagnostics: ParseDiagnostic[] = [...result.diagnostics];
  const missingBefore = getMissingFields(result);

  if (missingBefore.name || missingBefore.description || missingBefore.parameters) {
    try {
      const remote = await requestOpenRouterExtraction(result.document.raw, missingBefore);
      if (remote.payload) {
        const changed = applyExtraction(result, remote.payload);
        if (changed) {
          diagnostics.push({
            level: "warning",
            code: remote.source === "cache" ? "SEMANTIC_OPENROUTER_CACHE_APPLIED" : "SEMANTIC_OPENROUTER_APPLIED",
            message:
              remote.source === "cache"
                ? "Semantic extraction loaded from OpenRouter cache."
                : "Semantic extraction applied from OpenRouter.",
            file: result.document.path,
            section: "semantic",
            hint: "Provide canonical frontmatter/table for deterministic parsing.",
          });
        }
      }
    } catch (error) {
      diagnostics.push({
        level: "warning",
        code: "SEMANTIC_OPENROUTER_FAILED",
        message: `OpenRouter semantic extraction failed: ${error instanceof Error ? error.message : String(error)}`,
        file: result.document.path,
        section: "semantic",
        hint: "Check OPENROUTER_API_KEY or use strict/tolerant mode.",
      });
    }
  }

  const basename = path.basename(result.document.path, path.extname(result.document.path));

  if (!result.document.meta.name) {
    result.document.meta.name = slugToName(basename);
    diagnostics.push({
      level: "warning",
      code: "SEMANTIC_NAME_INFERRED",
      message: "Skill name inferred from file name.",
      file: result.document.path,
      section: "semantic",
      hint: "Add frontmatter `name` to avoid fallback inference.",
    });
  }

  if (!result.document.meta.description) {
    result.document.meta.description = `Auto-generated description for ${result.document.meta.name}.`;
    diagnostics.push({
      level: "warning",
      code: "SEMANTIC_DESCRIPTION_INFERRED",
      message: "Skill description inferred automatically.",
      file: result.document.path,
      section: "semantic",
      hint: "Add frontmatter `description` to avoid fallback inference.",
    });
  }

  result.diagnostics = removeResolvedWarnings(diagnostics, result);
  return result;
}
