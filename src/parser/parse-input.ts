import type { ParseMode, ParseResult } from "../ir/types.js";
import { buildSkillDocument } from "./build-skill-document.js";
import { loadSkillFiles } from "./file-loader.js";

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

  for (const rawFile of rawFiles) {
    try {
      results.push(buildSkillDocument(rawFile, mode));
    } catch (error) {
      if (mode === "strict") {
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
