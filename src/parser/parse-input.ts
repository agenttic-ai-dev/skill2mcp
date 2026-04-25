import type { ParseMode, ParseResult } from "../ir/types.js";
import { buildSkillDocument } from "./build-skill-document.js";
import { loadSkillFiles } from "./file-loader.js";
import { enrichParseResultWithSemanticFallback } from "./semantic-enricher.js";

export interface ParsedInputResult {
  results: ParseResult[];
}

export interface ParsedInputError {
  error: string;
  diagnostics: unknown[];
}

export async function parseInputPath(
  inputPath: string,
  mode: ParseMode,
): Promise<ParsedInputResult | ParsedInputError> {
  const rawFiles = await loadSkillFiles(inputPath);
  const results: ParseResult[] = [];
  const parserMode = mode === "strict" ? "strict" : "tolerant";

  for (const rawFile of rawFiles) {
    try {
      let parsed = buildSkillDocument(rawFile, parserMode);
      if (mode === "semantic") {
        parsed = await enrichParseResultWithSemanticFallback(parsed);
      }
      results.push(parsed);
    } catch (error) {
      if (parserMode === "strict") {
        const diagnostics = (error as Error & { diagnostics?: unknown[] }).diagnostics ?? [];
        return {
          error: error instanceof Error ? error.message : String(error),
          diagnostics,
        };
      }
      throw error;
    }
  }

  return { results };
}
