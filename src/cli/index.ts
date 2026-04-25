#!/usr/bin/env node
import { Command } from "commander";
import { runBuildCommand } from "./build.js";
import { runParseCommand } from "./parse.js";
import { runInspectCommand } from "./inspect.js";

const program = new Command();

program
  .name("skill2mcp")
  .description("Parse SKILL markdown files into SkillDocument IR")
  .version("0.1.0");

program
  .command("parse")
  .argument("<input>", "Path to a SKILL markdown file or directory")
  .option("--mode <mode>", "Parser mode: strict | tolerant", "tolerant")
  .option("--format <format>", "Output format", "json")
  .action(async (input: string, options: { mode: string; format: string }) => {
    const mode = options.mode === "strict" ? "strict" : "tolerant";
    await runParseCommand(input, {
      mode,
      format: "json",
    });
  });

program
  .command("inspect")
  .argument("<input>", "Path to a SKILL markdown file or directory")
  .option("--mode <mode>", "Parser mode: strict | tolerant", "tolerant")
  .option("--format <format>", "Output format", "json")
  .action(async (input: string, options: { mode: string; format: string }) => {
    const mode = options.mode === "strict" ? "strict" : "tolerant";
    await runInspectCommand(input, {
      mode,
      format: "json",
    });
  });

program
  .command("build")
  .argument("<input>", "Path to a SKILL markdown file or directory")
  .requiredOption("--out <dir>", "Output directory for generated MCP package")
  .option("--mode <mode>", "Parser mode: strict | tolerant", "tolerant")
  .option("--transport <transport>", "Server transport: stdio | http | both", "both")
  .option("--watch", "Watch input path and rebuild on changes", false)
  .option("--format <format>", "Output format", "json")
  .action(
    async (
      input: string,
      options: { mode: string; out: string; transport: string; watch: boolean; format: string },
    ) => {
      const mode = options.mode === "strict" ? "strict" : "tolerant";
      const transport =
        options.transport === "stdio" || options.transport === "http" ? options.transport : "both";
      await runBuildCommand(input, {
        mode,
        outDir: options.out,
        transport,
        watch: options.watch,
        format: "json",
      });
    },
  );

program.parseAsync(process.argv);
