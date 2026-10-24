# Changelog

## 0.1.0

- Initial release: per-rule desktop/mobile visibility for DSH Web UI elements.
- Default rules: Token 吉祥物, Memory 浮窗, Live2D 桌宠, VRM 桌宠 (package defaults: desktop visible / mobile hidden; each profile can override).
- Mobile-only reposition of better-sidebar's `[data-dsh-dock-fallback]`, including `env(safe-area-inset-top)` offset for notched phones.
- Settings page (Settings → 插件显示与隐藏): enable/desktop/mobile toggles, add/remove custom selectors, editable mobile media query, save/discard.
- Comma-separated selector lists are gated per branch; `>` child combinators are supported.
- Selector/media validation: CSSOM + balance checks, rejects comments/braces/unclosed quotes, 200-rule/500-char/300-char limits.
- Protected-UI guard: refuses selectors that can hide the DSH root, approval dialog, settings page, or sidebar.
- Emergency bypass: `?uivis=off` disables injected hiding while keeping the settings section.
- Atomic save with `expectedRevision`; checks every fallback `set()` result; clears stale "已保存" status on edits.
- Lifecycle fixes: config subscription disposal, legacy media-listener cleanup, per-instance settings style, HMR attribute ownership.
- Accessibility: labelled inputs, row-specific delete labels, live status region.
- Compatibility metadata moved to `engines.dsh`; package repository/homepage/bugs/author added.
