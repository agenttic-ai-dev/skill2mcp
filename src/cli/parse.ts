import { loadSkillFiles } from "../parser/file-loader.js";
import { buildSkillDocument } from "../parser/build-skill-document.js";
import type { ParseMode, ParseResult } from "../ir/types.js";

export interface ParseCommandOptions {
  mode: ParseMode;
  format: "json";
}

export async function runParseCommand(inputPath: string, options: ParseCommandOptions): Promise<void> {
  const rawFiles = await loadSkillFiles(inputPath);
  const results: ParseResult[] = [];

  for (const rawFile of rawFiles) {
    try {
      results.push(buildSkillDocument(rawFile, options.mode));
    } catch (error) {
      if (options.mode === "strict") {
        const diagnostics = (error as Error & { diagnostics?: unknown }).diagnostics;
        const payload = {
          error: error instanceof Error ? error.message : String(error),
          diagnostics: diagnostics ?? [],
        };
        process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
        process.exitCode = 1;
        return;
      }
      throw error;
    }
  }

  const payload = {
    mode: options.mode,
    results,
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}
