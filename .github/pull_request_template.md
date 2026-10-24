## Summary

<!-- What changed, and why? -->

## Type

- [ ] Bug fix
- [ ] Feature
- [ ] Documentation
- [ ] Packaging / CI
- [ ] Refactor (no behavior change)

## Verification

- [ ] `npm test` passes (state test count)
- [ ] `npm pack --dry-run` shows the expected 7 files
- [ ] Tested desktop 1440×900
- [ ] Tested mobile 390×844 (touch emulation)
- [ ] If dock fallback changed: simulated safe-area 47px and FAB hit-testing
- [ ] If selectors changed: updated `docs/SELECTORS.md`

## Safety / privacy

- [ ] No secrets, tokens, cookies, or private data in code, logs, or screenshots
- [ ] No new network/storage/dynamic-code/subprocess access in the client
- [ ] Protected UI guard still rejects root / approval / settings / sidebar selectors
- [ ] Selector lists are gated per branch

## Notes

<!-- Screenshots (redacted) or compatibility notes. -->
