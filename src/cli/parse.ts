import type { ParseMode } from "../ir/types.js";
import { parseInputPath } from "../parser/parse-input.js";

export interface ParseCommandOptions {
  mode: ParseMode;
  format: "json";
}

export async function runParseCommand(inputPath: string, options: ParseCommandOptions): Promise<void> {
  const parsed = await parseInputPath(inputPath, options.mode);
  if ("error" in parsed) {
    process.stderr.write(`${JSON.stringify(parsed, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  const payload = {
    mode: options.mode,
    results: parsed.results,
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}
