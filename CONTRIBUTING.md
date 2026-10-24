# Contributing

Thanks for improving `dsh-ui-visibility`.

## Development setup

```bash
git clone https://github.com/hatsuyuki280/dsh-ui-visibility.git
cd dsh-ui-visibility
npm ci --ignore-scripts
npm test
npm pack --dry-run
```

Requirements: Node.js `>=22.19`, npm `>=10`.

## What to change

- Client behavior lives in `lib/client.js`; host Config schema is `lib/index.js`.
- Keep the client bundle compatible with DSH's classic `window.__ModuleLoader__.load({ id, factory })` format.
- Do not add direct network, storage, dynamic-code, or subprocess access to the client.
- Keep viewport gating correct for **every** branch of a comma-separated selector; use `gateSelector`.
- Refuse selectors that can hide DSH root / approval / settings / sidebar; update `docs/SELECTORS.md` when adding defaults.
- Do not use hashed CSS-module class names in default selectors; use stable `data-*` / IDs.

## Pull requests

1. Add or update a test in `test/` for behavior changes.
2. Run `npm test` and `npm pack --dry-run`.
3. Update `README.md` / `CHANGELOG.md` for user-visible changes.
4. If you add screenshots: remove all sidebar history, account names, balances, tokens, and local paths before committing.
5. Never commit secrets, `.env` files, `node_modules`, or tarballs.

PRs should be focused. Describe the user-facing behavior, the failure mode, and the verification commands.

## Commit style

Conventional-ish, imperative subject:

```text
feat: gate every selector in a comma list
fix: add safe-area offset to dock fallback
docs: document ?uivis=off recovery
```

## Release process (maintainers)

1. Ensure `main` is green in CI.
2. Bump `package.json` version and `CHANGELOG.md`.
3. Commit `release: vX.Y.Z`.
4. Tag `vX.Y.Z` and push the tag.
5. `.github/workflows/publish.yml` publishes to npm with provenance, using the `NPM_TOKEN` environment secret or npm trusted publishing.
6. Verify `npm view dsh-ui-visibility@X.Y.Z version repository engines` and the provenance link.

Do not publish from a dirty local tree.

## Security reports

See [SECURITY.md](./SECURITY.md). Do not open public issues for vulnerabilities.
