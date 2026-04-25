import path from "node:path";
import { buildProject } from "../generator/build-project.js";
import type { ParseMode } from "../ir/types.js";
import type { TransportMode } from "../generator/types.js";

export interface BuildCommandOptions {
  mode: ParseMode;
  outDir: string;
  transport: TransportMode;
  format: "json";
}

export async function runBuildCommand(inputPath: string, options: BuildCommandOptions): Promise<void> {
  const outDir = path.resolve(options.outDir);
  const result = await buildProject(inputPath, {
    mode: options.mode,
    outDir,
    transport: options.transport,
  });

  if ("error" in result) {
    process.stderr.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  const payload = {
    mode: options.mode,
    transport: options.transport,
    outDir,
    generatedFiles: result.files.map((file) => file.path),
    tools: result.tools,
    diagnostics: result.diagnostics,
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}
