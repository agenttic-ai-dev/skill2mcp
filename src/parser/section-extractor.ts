export interface SectionsMap {
  [name: string]: string;
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function extractSections(content: string): SectionsMap {
  const sections: SectionsMap = {};
  const headingRegex = /^##\s+(.+)$/gm;
  const matches = [...content.matchAll(headingRegex)];

  if (matches.length === 0) {
    return sections;
  }

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];

    if (current.index === undefined) {
      continue;
    }

    const rawHeader = current[1].trim();
    const contentStart = current.index + current[0].length;
    const contentEnd = next?.index ?? content.length;
    sections[normalizeHeader(rawHeader)] = content.slice(contentStart, contentEnd).trim();
  }

  return sections;
}
