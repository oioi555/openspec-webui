## Why

OpenSpec WebUI operators currently have no in-app way to see which `openspec-webui` version they are running, whether a newer release exists, or which OpenSpec CLI version is installed locally. That makes upgrades easy to miss, and OpenSpec CLI upgrades are especially error-prone because they also require running `openspec update` in each project afterward.

## What Changes

- Add a new `Versions` section to the settings dialog that shows installed and latest versions for both `openspec-webui` and the OpenSpec CLI.
- Fetch and expose latest-version metadata at server startup without blocking normal app startup, including graceful handling when network access or the OpenSpec CLI is unavailable.
- Show recommended update commands for both tools, using the representative npm global-install path as the primary example, and make those commands easy to copy from the UI.
- Add fixed links from each tool section to its GitHub releases page so operators can review release notes and change details.
- Explain that after upgrading OpenSpec CLI, operators must run `openspec update` in each project to refresh generated instructions, skills, and commands.
- Show a client-side toast when `openspec-webui` or OpenSpec CLI has an update available, while avoiding repeated notifications for the same latest version in the same browser.

## Capabilities

### New Capabilities
- `versions-page`: Surface installed/latest version status, update guidance, and update notifications for `openspec-webui` and OpenSpec CLI.

### Modified Capabilities
- `command-preferences`: Extend the settings dialog navigation and content model to include a `Versions` section alongside the existing settings categories.

## Impact

- `src/server/` startup and API surface for version checks / metadata exposure
- `frontend/src/lib/components/layout/SettingsModal.svelte` and related frontend state for a new `Versions` page with copy actions and release links
- client-side toast / dismissal persistence for update notifications
- npm/OpenSpec version lookup logic and command copy UX
