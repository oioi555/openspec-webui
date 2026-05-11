## Why

The Versions section currently shows a startup snapshot only. That is enough to answer “what did the server see when it booted?”, but it does not help when the operator upgrades `openspec-webui` or OpenSpec CLI after startup and wants to confirm the new status without restarting the server.

The page already exposes `checkedAt`, but without a manual refresh action the timestamp can only tell the operator that the data is old, not give them a way to re-check it in place.

## What Changes

- Add a manual refresh action to the Versions section header so the operator can trigger a fresh version-status lookup on demand.
- Show the most recent version-check timestamp in the Versions section header, immediately to the left of the refresh icon button.
- Keep the initial startup snapshot behavior, but make the timestamp visible enough that the operator can tell how old the current data is before deciding to refresh.
- Reuse the existing version snapshot service on the server instead of adding a second version-check path.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `versions-page`: The Versions page exposes the last successful check time and allows the operator to trigger a fresh version-status snapshot without restarting the app.

## Impact

- Affects `src/server/version-status.ts` API exposure so the existing refresh operation can be triggered from the client.
- Affects `frontend/src/lib/state/versionStatus.svelte.ts` so manual refresh performs a real server-side recheck instead of only re-reading the cached snapshot.
- Affects `frontend/src/lib/components/layout/SettingsView.svelte` header layout to add checked-at metadata plus a right-aligned refresh icon action.
- Adds localization and UI/server tests for manual refresh, loading-state disabling, and checked-at rendering.
