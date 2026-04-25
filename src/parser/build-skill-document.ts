import type { ParseDiagnostic, ParseMode, ParseResult, SkillDocument, SkillExample } from "../ir/types.js";
import type { RawSkillFile } from "./file-loader.js";
import { parseFrontmatter } from "./frontmatter.js";
import { extractSections } from "./section-extractor.js";
import { parseParametersTable } from "./table-parser.js";

function extractExamples(section: string): SkillExample[] {
  if (!section.trim()) {
    return [];
  }

  const chunks = section
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks.map((chunk) => {
    const inputMatch = chunk.match(/\*\*Input:\*\*\s*(.+)/i);
    const outputMatch = chunk.match(/\*\*Output:\*\*\s*(.+)/i);
    return {
      input: inputMatch?.[1]?.trim(),
      output: outputMatch?.[1]?.trim(),
      description: chunk,
    };
  });
}

function extractTriggers(section: string): string[] {
  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^-\s+/, "").replace(/^"|"$/g, ""))
    .filter(Boolean);
}

function getFirstSection(sections: Record<string, string>, candidates: string[]): string {
  for (const candidate of candidates) {
    if (sections[candidate]) {
      return sections[candidate];
    }
  }
  return "";
}

function validateDocument(document: SkillDocument, mode: ParseMode): ParseDiagnostic[] {
  const diagnostics: ParseDiagnostic[] = [];
  const isStrict = mode === "strict";
  const missingLevel: ParseDiagnostic["level"] = isStrict ? "error" : "warning";

  if (!document.meta.name) {
    diagnostics.push({
      level: missingLevel,
      code: "MISSING_SKILL_NAME",
      message: "Skill name is missing in frontmatter.",
      file: document.path,
      section: "frontmatter",
      hint: "Add `name` to the YAML frontmatter.",
    });
  }

  if (!document.meta.description) {
    diagnostics.push({
      level: missingLevel,
      code: "MISSING_SKILL_DESCRIPTION",
      message: "Skill description is missing in frontmatter.",
      file: document.path,
      section: "frontmatter",
      hint: "Add `description` to the YAML frontmatter.",
    });
  }

  if (document.parameters.length === 0) {
    diagnostics.push({
      level: missingLevel,
      code: "MISSING_PARAMETERS",
      message: "No parameters could be extracted from the Parameters section.",
      file: document.path,
      section: "parameters",
      hint: "Use a markdown table with Name, Type, Required, Default, Description columns.",
    });
  }

  return diagnostics;
}

export function buildSkillDocument(rawFile: RawSkillFile, mode: ParseMode): ParseResult {
  const frontmatter = parseFrontmatter(rawFile.content, rawFile.path);
  const sections = extractSections(frontmatter.body);

  const parametersSection = getFirstSection(sections, ["parameters", "params"]);
  const examplesSection = getFirstSection(sections, ["examples"]);
  const triggersSection = getFirstSection(sections, ["triggers"]);
  const notesSection = getFirstSection(sections, ["notes", "additional notes"]);

  const document: SkillDocument = {
    path: rawFile.path,
    meta: {
      name: frontmatter.meta.name ?? "",
      version: frontmatter.meta.version,
      description: frontmatter.meta.description ?? "",
      tags: frontmatter.meta.tags ?? [],
    },
    parameters: parseParametersTable(parametersSection),
    examples: extractExamples(examplesSection),
    triggers: extractTriggers(triggersSection),
    notes: notesSection,
    raw: rawFile.content,
  };

  const diagnostics = [...frontmatter.diagnostics, ...validateDocument(document, mode)];

  if (mode === "strict" && diagnostics.some((diagnostic) => diagnostic.level === "error")) {
    const strictError = new Error(`Strict parsing failed for ${rawFile.path}`);
    (strictError as Error & { diagnostics?: ParseDiagnostic[] }).diagnostics = diagnostics;
    throw strictError;
  }

  return {
    document,
    diagnostics,
  };
}
