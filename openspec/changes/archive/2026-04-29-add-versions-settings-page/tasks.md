## 1. Server-side version snapshot

- [x] 1.1 Add server-side logic to read the current `openspec-webui` package version and fetch the latest npm version for `openspec-webui`
- [x] 1.2 Add server-side logic to detect the installed OpenSpec CLI version via `openspec --version` and fetch the latest npm version for `@fission-ai/openspec`
- [x] 1.3 Expose the combined version snapshot through an app-level API payload without blocking normal startup when lookups fail

## 2. Versions page UI

- [x] 2.1 Extend the settings dialog sidebar to add a `Versions` category
- [x] 2.2 Implement the `Versions` page content for WebUI and OpenSpec CLI installed/latest/status details, representative update commands, and GitHub releases links
- [x] 2.3 Add small copy actions for the displayed update commands and the `openspec update` guidance
- [x] 2.4 Render registered project roots with guidance to run `openspec update` in each project after an OpenSpec CLI upgrade

## 3. Update notification behavior

- [x] 3.1 Add frontend state/loading for the version snapshot during app initialization
- [x] 3.2 Show a toast when WebUI or OpenSpec CLI updates are available
- [x] 3.3 Persist and honor per-browser deduplication so the same latest-version snapshot only toasts once

## 4. Spec synchronization and verification

- [x] 4.1 Apply the `command-preferences` delta to `openspec/specs/command-preferences/spec.md`
- [x] 4.2 Add the new `versions-page` main spec under `openspec/specs/versions-page/spec.md`
- [x] 4.3 Add or update automated tests for successful, unavailable, and outdated version states, copy actions, release links, and toast deduplication
- [x] 4.4 Run relevant test/typecheck verification for the server and frontend changes
