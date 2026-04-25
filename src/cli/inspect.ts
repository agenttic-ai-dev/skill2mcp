import type { ParseMode } from "../ir/types.js";
import { parseInputPath } from "../parser/parse-input.js";
import { mapSkillToTool } from "../transformer/tool-mapper.js";

export interface InspectCommandOptions {
  mode: ParseMode;
  format: "json";
}

export async function runInspectCommand(inputPath: string, options: InspectCommandOptions): Promise<void> {
  const parsed = await parseInputPath(inputPath, options.mode);

  if ("error" in parsed) {
    process.stderr.write(`${JSON.stringify(parsed, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  const results = parsed.results.map((entry) => {
    const mapped = mapSkillToTool(entry.document);
    return {
      source: entry.document.path,
      tool: mapped.tool,
      diagnostics: [...entry.diagnostics, ...mapped.diagnostics],
    };
  });

  const payload = {
    mode: options.mode,
    tools: results.map((result) => result.tool),
    results,
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}
