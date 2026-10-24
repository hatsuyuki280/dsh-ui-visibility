# Troubleshooting

## The settings section is missing

- Hard-refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`).
- Open **Plugins** and confirm `dsh-ui-visibility` is enabled.
- The section is under **Settings**, not the plugin card.
- On mobile, the settings nav may scroll horizontally; find **插件显示与隐藏**.

## The page says "配置尚未就绪"

The host `configForms` service is not ready or unavailable. Confirm you are using the Web profile on DSH 0.2.1-rc.2+. Hard-refresh; if it persists, check the DSH logs for a plugin activation failure.

## A rule does not hide anything

- Check the rule is enabled and the correct "显示" switch is off for the current viewport.
- Validate the selector in DevTools (`document.querySelector('...')`).
- The target may be inside a shadow root or iframe; global CSS cannot reach it.
- The selector may have been rejected as protected/malformed; look for the save error.
- Upstream plugin may have renamed its `data-*` hook; see [Selectors](Selectors).

## The whole UI disappeared

Append `?uivis=off` to the URL and reload. Edit/delete the offending rule, save, then remove the parameter.

## The dock button still overlaps the drawer FAB

- Ensure the dock-fix switch is on.
- Confirm `env(safe-area-inset-top)` is reflected by the device (add `viewport-fit=cover` if you control the page).
- Upstream `dsh-web-mobile` / `dsh-better-sidebar` may have changed geometry; please open an issue with a screenshot and device metrics.

## Hidden elements still run

Hiding is visual only; timers, WebGL, polling, and plugin logic continue. To stop a plugin, disable it in **Plugins**.
