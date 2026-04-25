import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { runInspectCommand } from "../src/cli/inspect.js";

const fixturesDir = path.resolve("fixtures/skills");

describe("inspect command", () => {
  it("prints mapped tools in json payload", async () => {
    let output = "";
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array) => {
      output += String(chunk);
      return true;
    });

    await runInspectCommand(path.join(fixturesDir, "valid-skill.md"), {
      mode: "strict",
      format: "json",
    });

    writeSpy.mockRestore();

    const payload = JSON.parse(output);
    expect(Array.isArray(payload.tools)).toBe(true);
    expect(payload.tools[0].name).toBe("docx-generator");
    expect(payload.results[0].diagnostics).toHaveLength(0);
  });
});
