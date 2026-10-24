# Installation

## Requirements

- DSH `>=0.2.1-rc.2 <0.3.0`
- Node.js `>=22.19`
- A `web` profile with `configForms` (the Web GUI provides it)

## Install from npm (after first publish)

```bash
dsh plugin --profile web add dsh-ui-visibility
```

## Install from a local checkout

```bash
git clone https://github.com/hatsuyuki280/dsh-ui-visibility.git
cd dsh-ui-visibility
dsh plugin --profile web add .
```

If `dsh` is not global:

```bash
npx @deepseek-ai/dsh plugin --profile web add /absolute/path/to/dsh-ui-visibility
```

Restart `dsh web` after installation. The plugin adds a row with id `ui-visibility` to the profile patch.

## Verify

- Open **Plugins** and confirm `dsh-ui-visibility` is enabled.
- Open **Settings → 插件显示与隐藏**; the page should show four example rules and be editable.
- If the page says configuration is not ready, hard-refresh once and confirm the plugin switch is on.

## Uninstall

```bash
dsh plugin --profile web remove dsh-ui-visibility
```

Removing the plugin removes its injected styles; existing rules stay in the profile patch until you delete the row or reset the profile.
