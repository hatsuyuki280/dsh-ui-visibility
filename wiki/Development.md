# Development

```bash
git clone https://github.com/hatsuyuki280/dsh-ui-visibility.git
cd dsh-ui-visibility
npm ci --ignore-scripts
npm test
npm pack --dry-run
```

## Layout

- `lib/index.js` — host Config schema.
- `lib/client.js` — browser bundle (classic `window.__ModuleLoader__.load`).
- `test/host.test.mjs`, `test/client.test.mjs` — unit tests.
- `docs/SELECTORS.md` — stable selector contracts.
- `AGENTS.md` — invariants for AI agents.

## Tests

`npm test` runs 19 tests covering defaults, selector-list gating, protected UI, validation, media fallback, `?uivis=off`, atomic save/revision/refusal, subscription disposal, and schema limits.

CI runs Node 22 and 24, checks the 7-file package set, and asserts packed file modes are `0644`.

## Release

Maintainers tag `vX.Y.Z`; `.github/workflows/publish.yml` publishes with provenance using the `NPM_TOKEN` secret (or npm trusted publishing). See [CONTRIBUTING.md](https://github.com/hatsuyuki280/dsh-ui-visibility/blob/main/CONTRIBUTING.md).
