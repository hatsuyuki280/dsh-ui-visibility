# Configuration

Open **Settings → 插件显示与隐藏**.

## Rule fields

| Field | Meaning |
| --- | --- |
| 名称 | Display name for the rule |
| CSS 选择器 | One selector, or a top-level comma list; each branch is gated separately |
| 启用 | Whether the rule is evaluated |
| 桌面显示 | Keep the target visible on desktop |
| 手机显示 | Keep the target visible on mobile |

A rule only hides when the corresponding "显示" switch is off. Both switches off means the target is hidden on both viewports.

## Example: hide a custom floating widget only on phones

1. Inspect the widget in DevTools and find a stable `data-*` or `id`.
2. Click **添加规则**.
3. Name: `My widget`; selector: `[data-my-widget]`.
4. Enable it, check **桌面显示**, leave **手机显示** unchecked.
5. Save.

## Selector lists

`#a, #b` is supported. The generated CSS is:

```css
html[data-ui-vis-mobile="1"] #a,
html[data-ui-vis-mobile="1"] #b { display: none !important; }
```

Commas inside `:is(...)`, `:not(...)`, and quoted attribute values are preserved.

## Mobile media query

Default: `(pointer: coarse) and (max-width: 1023px)`.

This means a mouse-driven narrow desktop window is still desktop, while a touch phone/tablet under the width threshold is mobile. Change it only if your device is misclassified; invalid queries are rejected on save.

## Dock fallback

`dsh-better-sidebar` renders a small `[data-dsh-dock-fallback]` entry. On mobile the plugin moves it below the `dsh-web-mobile` drawer FAB, including the safe-area inset:

```css
top: calc(env(safe-area-inset-top, 0px) + 60px);
left: 10px;
```

Turn the switch off if you do not use either plugin.

## Limits and guardrails

- Max 200 rules; max 500 characters per selector; max 300 for the media query.
- Rejected: `{ } <`, CSS comments, control characters, unbalanced quotes/parentheses/brackets.
- Protected UI cannot be hidden: `html`, `body`, `#root`, `[data-approval-*]`, `[role=dialog]`, `.uivis-page`, `[data-slot="sidebar"]`.
- `>` is allowed.

## Recovery

Append `?uivis=off` to the app URL and reload. Hiding rules are cleared; the settings page remains available. Remove the parameter to re-enable.
