# Selectors

Use stable DOM hooks. Never use hashed CSS-module class names.

| Target | Selector | Source |
| --- | --- | --- |
| Token pet | `[data-token-pet="true"]` | `dsh-token-viewer` |
| Memory entry | `#mem-open` | `dsh-memento` |
| Live2D pet | `[data-dsh-live2d-pet-root]` | `dsh-pet-live2d` |
| VRM pet | `[data-vrmpet3d="1"]` | `dsh-plugin-vrmpet3d` |
| Dock fallback | `[data-dsh-dock-fallback]` | `dsh-better-sidebar` |

See the repository's [docs/SELECTORS.md](https://github.com/hatsuyuki280/dsh-ui-visibility/blob/main/docs/SELECTORS.md) for validation rules and drift notes.

## Finding a selector

1. Open DevTools → Elements.
2. Pick a stable `data-*` attribute or `id` on the target root.
3. Avoid `nth-child`, generated classes, and IDs that contain random build hashes.
4. Add the rule and verify at 1440×900 and 390×844.

## Protected UI

The plugin refuses to hide the DSH root, approval dialog, settings page, or sidebar. This prevents hiding the approval detail while leaving the Allow button clickable, and prevents blanking the UI.
