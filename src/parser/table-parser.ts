import type { SkillParameter } from "../ir/types.js";

function normalizeCell(value: string): string {
  return value.trim().replace(/^`|`$/g, "");
}

function splitRow(line: string): string[] {
  return line
    .split("|")
    .map((cell) => normalizeCell(cell))
    .filter((cell, index, arr) => !(index === 0 && cell === "") && !(index === arr.length - 1 && cell === ""));
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isTruthyRequired(value: string): boolean {
  return ["yes", "true", "required", "y", "1"].includes(value.toLowerCase());
}

export function parseParametersTable(sectionContent: string): SkillParameter[] {
  const lines = sectionContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));

  if (lines.length < 2) {
    return [];
  }

  const rows = lines.map(splitRow).filter((cells) => cells.length > 0);
  if (rows.length < 2) {
    return [];
  }

  const header = rows[0].map((cell) => cell.toLowerCase());
  const dataRows = isSeparatorRow(rows[1]) ? rows.slice(2) : rows.slice(1);

  const nameIndex = header.findIndex((cell) => cell === "name");
  const typeIndex = header.findIndex((cell) => cell === "type");
  const requiredIndex = header.findIndex((cell) => cell === "required");
  const defaultIndex = header.findIndex((cell) => cell === "default");
  const descriptionIndex = header.findIndex((cell) => cell === "description");

  if (nameIndex < 0 || typeIndex < 0 || requiredIndex < 0 || descriptionIndex < 0) {
    return [];
  }

  return dataRows
    .map((cells) => ({
      name: cells[nameIndex] ?? "",
      type: cells[typeIndex] ?? "string",
      required: isTruthyRequired(cells[requiredIndex] ?? ""),
      defaultValue: (cells[defaultIndex] ?? "") || undefined,
      description: cells[descriptionIndex] ?? "",
    }))
    .filter((parameter) => parameter.name.length > 0);
}
