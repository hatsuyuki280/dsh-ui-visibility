# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| `0.1.x` | ✅ |

## Reporting a vulnerability

Please use **GitHub Security Advisories** for this repository:

<https://github.com/hatsuyuki280/dsh-ui-visibility/security/advisories/new>

Do **not** open a public issue for a vulnerability. Include:

- affected version and DSH version;
- browser/OS and profile (`web`/desktop);
- minimal reproduction (settings JSON or selector list);
- impact and any suggested fix.

We aim to acknowledge within 7 days. This is a community plugin maintained on a best-effort basis; no bug bounty is offered.

## Scope

In scope: the plugin's client bundle, settings page, selector/media validation, protected-UI guard, and build/release metadata.

Out of scope: vulnerabilities in DSH itself, third-party plugins listed as default targets (`dsh-token-viewer`, `dsh-memento`, `dsh-pet-live2d`, `dsh-plugin-vrmpet3d`, `dsh-better-sidebar`, `dsh-web-mobile`), and browser/OS issues.

## Security model (summary)

- The settings page is an **administrator surface**; selectors are trusted configuration, but the plugin still rejects malformed/unbalanced input and refuses to hide protected DSH UI (root, approval dialog, settings page, sidebar).
- Hiding is **visual only**; plugin logic continues to run. It is not an authorization or sandbox boundary.
- The client has no direct network, storage, dynamic-code, or subprocess access; configuration reads/writes go through the host `configForms` service.
- `?uivis=off` is an emergency bypass that clears injected hiding rules while leaving the settings page reachable.
