## Why

Users have no at-a-glance visibility into version status from the dashboard—they must navigate to Settings → Versions to check. Additionally, when dashboard cards or activity bar buttons focus an explorer section, the section header may be off-screen, making the focus destination unclear.

## What Changes

- Add a version badge to the dashboard header (top-right, beside the FolderPen button) that summarizes version status:
  - **Up-to-date**: quiet outline badge showing the current app version
  - **Updates available**: warning-style badge displaying "current → latest" with an arrow, clickable to open Settings → Versions
- Add scroll-into-view behavior when `focusedSection` state changes programmatically (via dashboard card clicks or activity bar preset selection), scrolling the target explorer section header to the top of the explorer pane

## Capabilities

### New Capabilities
- `dashboard-version-badge`: Version status indicator in the dashboard header with conditional styling and navigation to Settings → Versions

### Modified Capabilities
- `explorer-pane`: Section headers scroll into view when `focusedSection` changes programmatically, not just on direct user toggle

## Impact

- `frontend/src/lib/views/Dashboard.svelte` — version badge in header
- `frontend/src/lib/components/shared/explorer-section/explorer-section.svelte` — reactive scroll on `focusedSection` change
- `frontend/src/lib/state/versionStatusCore.ts` — may expose helper for badge text/logic
- No backend changes; existing version-status service and store provide all needed data
