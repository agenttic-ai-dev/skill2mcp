# Release Checklist

## Pre-release

- Update `CHANGELOG.md` (`[Unreleased]` -> new version section)
- Confirm `README.md` examples still run as documented
- Confirm `ROADMAP.md` reflects actual delivered scope

## Validation

```bash
npm install
npm run build
npm test
npm run inspect -- ./fixtures/skills --mode tolerant
npm run gen -- ./fixtures/skills --out /tmp/skill2mcp-release-smoke --transport both --mode tolerant
```

Then validate generated package:

```bash
cd /tmp/skill2mcp-release-smoke
npm install
npm run build
```

## Packaging

- Verify `license` field in `package.json` is `MIT OR Apache-2.0`
- Verify `LICENSE-MIT` and `LICENSE-APACHE` exist
- Verify generated package includes `tools.json`, `src/server.ts`, and handler stubs

## Final checks

- No uncommitted local changes
- Branch merged to `main`
- Tag/version prepared according to release policy
