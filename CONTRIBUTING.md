# Contributing

Thanks for contributing to `skill2mcp`.

## Development setup

```bash
npm install
npm run build
npm test
```

## Branching rules

- Do not commit directly to `main`
- Use feature/fix branches (`feat/<slug>` or `fix/<slug>`)
- Keep changes focused and minimal

## Commit style

- AI-generated commits must start with `[AI]`
- Prefer concise messages with scope

Examples:

- `[AI] feat(parser): add semantic fallback mode`
- `[AI] fix(generator): correct server template output`

## Quality gates before merge

```bash
npm run build
npm test
```

## What to update when behavior changes

- `README.md` for usage and command contracts
- `ROADMAP.md` if product-level directives change
- `CHANGELOG.md` with an entry under `Unreleased`

## Pull request checklist

- Feature is covered by tests or fixtures
- No unrelated files changed
- CLI output contract remains stable or is documented as a breaking change
