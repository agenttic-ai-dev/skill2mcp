import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadSkillFiles } from "../src/parser/file-loader.js";
import { buildSkillDocument } from "../src/parser/build-skill-document.js";
const fixturesDir = path.resolve("fixtures/skills");
describe("buildSkillDocument", () => {
    it("parses a valid skill in strict mode", async () => {
        const files = await loadSkillFiles(path.join(fixturesDir, "valid-skill.md"));
        const result = buildSkillDocument(files[0], "strict");
        expect(result.document.meta.name).toBe("docx-generator");
        expect(result.document.parameters).toHaveLength(3);
        expect(result.document.triggers).toHaveLength(3);
        expect(result.diagnostics).toHaveLength(0);
    });
    it("returns warnings in tolerant mode for ambiguous skills", async () => {
        const files = await loadSkillFiles(path.join(fixturesDir, "ambiguous-skill.md"));
        const result = buildSkillDocument(files[0], "tolerant");
        expect(result.document.parameters).toHaveLength(1);
        expect(result.diagnostics.some((diagnostic) => diagnostic.level === "warning")).toBe(true);
    });
    it("fails in strict mode when required fields are missing", async () => {
        const files = await loadSkillFiles(path.join(fixturesDir, "ambiguous-skill.md"));
        expect(() => buildSkillDocument(files[0], "strict")).toThrowError(/Strict parsing failed/);
    });
});
