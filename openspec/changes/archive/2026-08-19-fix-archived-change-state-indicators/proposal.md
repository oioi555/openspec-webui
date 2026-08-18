## Why

An active Change tab keeps its active-change icon after the Change is archived because the open tab retains the original name while the archive list exposes the date-prefixed archive name. The detail view already refreshes to archived state, so the stale tab and Activity Bar indicators create contradictory navigation state.

## What Changes

- Recognize an open Change as archived when its original name corresponds to a date-prefixed name in the refreshed archive list.
- Update the Change tab icon without requiring the tab to be closed or reopened.
- Keep the Activity Bar section synchronized with the same archived-name resolution used by the tab.
- Add regression coverage for an already-open Change transitioning from active to archived state.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tabbed-viewer`: Require an already-open Change tab to update its icon when the Change is archived under a date-prefixed name.
- `activity-bar`: Require the active section indicator to move to Archive for the same in-place active-to-archived transition.

## Impact

- Affects frontend archived Change name resolution in the tab bar and Activity Bar.
- Adds frontend regression tests for reactive archive-state transitions.
- Does not change server APIs, persisted tab identity, routing, or external dependencies.
