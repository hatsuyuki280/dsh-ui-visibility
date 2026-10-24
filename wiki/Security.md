# Security model

- The settings page is an **administrator surface**. Selectors are trusted configuration, but malformed input is still rejected.
- The client has no direct network, storage, dynamic-code, or subprocess access. Config reads/writes go through the host `configForms` service.
- Hiding is **visual only**; it is not an authorization, sandbox, or security boundary. Plugin logic continues to run.
- Protected UI guard: refuses selectors that can hide the DSH root, approval dialog, settings page, or sidebar.
- Emergency bypass: `?uivis=off`.
- Report vulnerabilities via [GitHub Security Advisories](https://github.com/hatsuyuki280/dsh-ui-visibility/security/advisories/new), not public issues.

See [SECURITY.md](https://github.com/hatsuyuki280/dsh-ui-visibility/blob/main/SECURITY.md) for scope and response expectations.
