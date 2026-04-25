import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

export interface RawSkillFile {
  path: string;
  content: string;
  mtimeMs: number;
}

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectMarkdownFiles(fullPath);
      }
      return entry.isFile() && entry.name.toLowerCase().endsWith(".md") ? [fullPath] : [];
    }),
  );
  return nested.flat();
}

export async function loadSkillFiles(inputPath: string): Promise<RawSkillFile[]> {
  const targetStat = await stat(inputPath);
  const files = targetStat.isDirectory() ? await collectMarkdownFiles(inputPath) : [inputPath];

  const loaded = await Promise.all(
    files.map(async (filePath) => {
      const [fileStat, content] = await Promise.all([stat(filePath), readFile(filePath, "utf8")]);
      return {
        path: path.resolve(filePath),
        content,
        mtimeMs: fileStat.mtimeMs,
      } satisfies RawSkillFile;
    }),
  );

  return loaded.sort((a, b) => a.path.localeCompare(b.path));
}
