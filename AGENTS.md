# AGENTS.md

Instructions for AI coding agents working on this repository.

## Project

`dsh-ui-visibility` is a DSH Web client plugin that injects a stylesheet hiding selected DOM elements per viewport (desktop/mobile), with a settings page backed by the host Config service.

## Layout

- `lib/index.js` — host Config schema (`Config`, `liveField`, defaults).
- `lib/client.js` — classic browser bundle: style injection, viewport gating, settings UI, save/validation, cleanup.
- `test/host.test.mjs` — schema/default/volatile/size-limit tests.
- `test/client.test.mjs` — VM harness for CSS generation, gating, protected UI, media validation, save/mutate, lifecycle.
- `cordis.patch.yml` — profile row (`id: ui-visibility`).
- `docs/SELECTORS.md` — stable selector contracts.
- `wiki/` — source for GitHub Wiki pages (also pushed to the wiki repo).

## Commands

```bash
npm ci --ignore-scripts
npm test                       # node --test test/host.test.mjs test/client.test.mjs
npm pack --dry-run
```

CI runs Node 22 and 24. Do not claim Node 20 support without a passing job.

## Invariants

- **No new runtime dependencies** without review; the host provides `@deepseek-ai/schemastery`.
- **No network/storage/dynamic code/subprocess** in the client (`fetch`, XHR, localStorage, eval, Function, innerHTML, child_process).
- **Viewport gating**: every branch of a comma-separated selector must be prefixed; do not regress to `prefix + selector`.
- **Protected UI**: never allow hiding of `html`, `body`, `#root`, `[data-approval-*]`, `[role=dialog]`, `.uivis-page`, or `[data-slot="sidebar"]`; keep syntax + runtime guards.
- **Emergency bypass**: `?uivis=off` must clear injected CSS while keeping the settings section reachable.
- **Dock fix**: keep `env(safe-area-inset-top)` offset and verify FAB hit-testing at a simulated 47px safe area.
- **Cleanup**: dispose the config subscription, remove the instance's styles, and only remove `data-ui-vis-*` when no other instance style remains.
- **Accessibility**: switches/inputs need labels; status uses `role="status"`; delete buttons are row-specific for screen readers.

## Change discipline

1. Add a failing test for the behavior (red).
2. Implement the minimal change (green).
3. Re-run the full test suite and an E2E smoke test when the change touches rendering/settings.
4. Update `README.md`, `CHANGELOG.md`, and `docs/SELECTORS.md` when user-visible behavior changes.

## Privacy

Never commit screenshots containing sidebar workspace/session titles, account names, balances, tokens, local paths, or internal URLs. Crop to the plugin panel or use a clean demo profile.

## Release

Do not publish from an agent session. Maintainers tag `vX.Y.Z`; `.github/workflows/publish.yml` publishes with provenance. The npm token lives only in the `npm-publish` environment secret; never write it to a file or log.
