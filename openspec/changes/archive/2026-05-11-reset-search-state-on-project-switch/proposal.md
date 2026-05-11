## Why

When the operator switches projects while the Search panel still shows results, the UI can keep the previous project's results visible even though the active project context has already changed.

That creates two bad outcomes:

- clicking a stale result can fail because the viewer now loads data under the new project context
- if both projects contain an item with the same name, the stale result can silently open the wrong artifact instead of obviously failing

This makes search feel unsafe across project boundaries.

## What Changes

- treat Search panel query/results as project-scoped UI state instead of cross-project UI state
- clear the visible search query and result list whenever the active project changes and project-scoped state is reinitialized
- invalidate pending search timers and in-flight search responses from the previous project so they cannot repopulate the Search panel after a switch
- keep Plan A behavior: do not auto-rerun the previous query in the new project

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `search`: Search panel query/results reset when the active project changes, and stale responses from the previous project are ignored

## Impact

- Affected frontend state includes `frontend/src/lib/state/appData.svelte.ts`, `frontend/src/lib/state/projectSync.ts`, `frontend/src/lib/state/search.svelte.ts`, and `frontend/src/lib/components/layout/searchController.ts`.
- Affected UI behavior includes Search panel reset timing during project switches, reconnect rebind flows, and no-active-project transitions.
- Regression coverage should verify both visible-result reset and in-flight-search invalidation during project changes.
- No backend API, parser, persistence, or CLI contract changes are expected.
