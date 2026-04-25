import { watch } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { buildProject } from "../generator/build-project.js";
import type { ParseMode } from "../ir/types.js";
import type { TransportMode } from "../generator/types.js";

export interface BuildCommandOptions {
  mode: ParseMode;
  outDir: string;
  transport: TransportMode;
  watch: boolean;
  format: "json";
}

interface BuildExecutionResult {
  ok: boolean;
}

function printJson(payload: unknown, isError = false): void {
  const line = `${JSON.stringify(payload, null, 2)}\n`;
  if (isError) {
    process.stderr.write(line);
    return;
  }
  process.stdout.write(line);
}

async function runBuildOnce(inputPath: string, options: BuildCommandOptions): Promise<BuildExecutionResult> {
  const outDir = path.resolve(options.outDir);
  const result = await buildProject(inputPath, {
    mode: options.mode,
    outDir,
    transport: options.transport,
  });

  if ("error" in result) {
    printJson(result, true);
    return { ok: false };
  }

  const payload = {
    status: "ok",
    mode: options.mode,
    transport: options.transport,
    outDir,
    generatedFiles: result.files.map((file) => file.path),
    tools: result.tools,
    diagnostics: result.diagnostics,
  };

  printJson(payload);
  return { ok: true };
}

async function collectSubdirectories(rootDir: string): Promise<string[]> {
  const directories: string[] = [rootDir];
  const queue: string[] = [rootDir];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const absolute = path.join(current, entry.name);
      directories.push(absolute);
      queue.push(absolute);
    }
  }

  return directories;
}

async function startWatchMode(inputPath: string, options: BuildCommandOptions): Promise<void> {
  const resolvedInput = path.resolve(inputPath);
  const initial = await runBuildOnce(resolvedInput, options);
  process.exitCode = initial.ok ? 0 : 1;

  const watcherPaths = new Set<string>();
  const stats = await readdir(path.dirname(resolvedInput)).catch(() => null);
  const isLikelyFileInput = stats !== null && path.extname(resolvedInput).toLowerCase() === ".md";

  if (isLikelyFileInput) {
    watcherPaths.add(path.dirname(resolvedInput));
  } else {
    watcherPaths.add(resolvedInput);
    const nestedDirs = await collectSubdirectories(resolvedInput).catch(() => [resolvedInput]);
    for (const dir of nestedDirs) {
      watcherPaths.add(dir);
    }
  }

  let timer: NodeJS.Timeout | undefined;

  const watchers = [...watcherPaths].map((watchPath) =>
    watch(watchPath, { persistent: true }, () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(async () => {
        const result = await runBuildOnce(resolvedInput, options);
        process.exitCode = result.ok ? 0 : 1;
      }, 250);
    }),
  );

  process.stderr.write(`Watching for changes in ${resolvedInput}\n`);

  await new Promise<void>((resolve) => {
    const closeAll = (): void => {
      for (const watcher of watchers) {
        watcher.close();
      }
      if (timer) {
        clearTimeout(timer);
      }
      resolve();
    };

    process.on("SIGINT", closeAll);
    process.on("SIGTERM", closeAll);
  });
}

export async function runBuildCommand(inputPath: string, options: BuildCommandOptions): Promise<void> {
  if (options.watch) {
    await startWatchMode(inputPath, options);
    return;
  }

  const result = await runBuildOnce(inputPath, options);
  process.exitCode = result.ok ? 0 : 1;
}
