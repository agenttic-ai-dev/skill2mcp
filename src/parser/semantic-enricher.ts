import path from "node:path";
import type { ParseDiagnostic, ParseResult } from "../ir/types.js";

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
    return true;
  });
}

export async function enrichParseResultWithSemanticFallback(result: ParseResult): Promise<ParseResult> {
  const diagnostics: ParseDiagnostic[] = [...result.diagnostics];
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
