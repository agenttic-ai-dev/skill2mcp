import matter from "gray-matter";
import type { ParseDiagnostic, SkillMeta } from "../ir/types.js";

interface FrontmatterResult {
  body: string;
  meta: Partial<SkillMeta>;
  diagnostics: ParseDiagnostic[];
}

function normalizeTags(tags: unknown): string[] {
  if (!tags) {
    return [];
  }
  if (Array.isArray(tags)) {
    return tags.map(String).map((tag) => tag.trim()).filter(Boolean);
  }
  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function parseFrontmatter(content: string, filePath: string): FrontmatterResult {
  const diagnostics: ParseDiagnostic[] = [];

  try {
    const parsed = matter(content);
    const data = parsed.data as Record<string, unknown>;

    return {
      body: parsed.content,
      meta: {
        name: typeof data.name === "string" ? data.name.trim() : "",
        version: typeof data.version === "string" ? data.version.trim() : undefined,
        description: typeof data.description === "string" ? data.description.trim() : "",
        tags: normalizeTags(data.tags),
      },
      diagnostics,
    };
  } catch (error) {
    diagnostics.push({
      level: "error",
      code: "FRONTMATTER_PARSE_FAILED",
      message: `Unable to parse frontmatter: ${error instanceof Error ? error.message : String(error)}`,
      file: filePath,
      section: "frontmatter",
      hint: "Check YAML delimiters and key/value syntax.",
    });

    return {
      body: content,
      meta: {},
      diagnostics,
    };
  }
}
