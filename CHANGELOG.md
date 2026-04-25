# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Placeholder for upcoming changes.

## [0.1.0] - 2026-04-24

### Added

- Deterministic parsing pipeline for `SKILL.md` files.
- Parser modes: `strict` and `tolerant`.
- Semantic cascade mode (`semantic`) with deterministic metadata enrichment.
- IR contracts for skills and diagnostics.
- Transformer layer: schema builder, tool mapper, validator.
- `inspect` command to emit MCP-style tool definitions.
- `build` command to generate deployable MCP server package.
- Generated MCP server with official MCP SDK and transports: `stdio`, `http`, `both`.
- Handler stub generation per tool.
- Watch mode (`build --watch`) for regeneration during editing.
- Unit and integration test suite for parser, transformer, inspect, and build flow.
- Dual license support (`MIT OR Apache-2.0`).
