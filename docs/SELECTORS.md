# Selector contracts

Default rules target **stable DOM hooks** published by the companion plugins. Never use generated CSS-module class names (for example `_pet_ab12cd`), because they change between builds.

| Target | Selector | Source | Notes |
| --- | --- | --- | --- |
| Token pet | `[data-token-pet="true"]` | `dsh-token-viewer` | Attribute on the pet button |
| Memory entry | `#mem-open` | `dsh-memento` | Stable id on the floating entry |
| Live2D pet | `[data-dsh-live2d-pet-root]` | `dsh-pet-live2d` | Mount container; contains the canvas/pet |
| VRM pet | `[data-vrmpet3d="1"]` | `dsh-plugin-vrmpet3d` | Widget root; overlay is `pointer-events:none` |
| Dock fallback | `[data-dsh-dock-fallback]` | `dsh-better-sidebar` | Moved only on mobile, with safe-area offset |

## Adding a rule

1. Open the target in the browser and inspect the element.
2. Prefer `data-*` attributes or `id`; avoid hashed classes and nth-child.
3. Add the selector in Settings → 插件显示与隐藏, or as a default in `lib/index.js` + `lib/client.js`.
4. Set **启用 / 桌面显示 / 手机显示** independently.
5. Verify on 1440×900 and 390×844; for mobile overlay targets, check that no pointer-blocking container remains.

## Selector lists

A rule may contain a top-level comma list, e.g. `#a, #b`. The plugin prefixes **each branch** with the viewport gate. Commas inside `:is(...)`, `:not(...)`, or quoted attribute values are preserved.

## Validation limits

- At most **200** rules.
- Each selector at most **500** characters.
- Reject `{`, `}`, `<`, CSS comments, control characters, unbalanced quotes/parentheses/brackets, and trailing escapes.
- The `>` child combinator is allowed.
- Mobile media query at most **300** characters; validated with `CSSStyleSheet`/balanced checks.

## Protected UI

The following cannot be hidden by a rule (save is rejected; render skips):

- `html`, `body`, `#root`, `:root`, `*`
- `[data-approval-scroll]`, `[data-approval-actions]`
- `[role="dialog"]`
- `.uivis-page`
- `[data-slot="sidebar"]`

If a selector matches one of these or an ancestor/descendant of a protected container, the rule is rejected. This prevents hiding the approval detail while leaving its Allow button clickable, and prevents blanking the app.

## Emergency recovery

Append `?uivis=off` to the app URL and reload. Injected CSS is cleared; the settings section stays available. Remove the parameter to resume.

## Upstream drift

The table is verified against the currently tested companion versions. A plugin update may rename a root; hiding then silently stops. Re-check this table after upgrading `dsh-token-viewer`, `dsh-memento`, `dsh-pet-live2d`, `dsh-plugin-vrmpet3d`, or `dsh-better-sidebar`.
