## Context

The Versions section already has most of the data needed for operator trust: current version, latest version, update status, and a `checkedAt` timestamp inside the snapshot payload. What it lacks is a visible relationship between those two facts:

- the data is point-in-time
- the operator can choose to fetch a newer point in time

Today the frontend store's `refresh()` method only re-reads `GET /api/version-status`, which returns the server's cached snapshot. The server-side snapshot service already supports `refresh()`, but that method is not exposed through the API. As a result, the UI has no way to turn “this timestamp is old” into “check again now”.

## Goals / Non-Goals

**Goals:**
- Add an explicit manual refresh path for version checks without changing the existing startup snapshot behavior.
- Surface the latest check time in the Versions section header where it is visible before the operator scans the details below.
- Place the checked-at text immediately left of the refresh icon so the age of the data and the action to refresh are visually paired.
- Reuse existing loading/error behavior and server refresh deduplication.

**Non-Goals:**
- Add automatic polling after startup.
- Add per-tool refresh controls; refresh remains one snapshot for both tools.
- Add background freshness heuristics such as “stale after N minutes”.
- Trigger package upgrades from the UI.

## Decisions

### 1. Keep startup snapshot as the baseline, add manual refresh as an explicit action

**Decision:** The server still performs an initial snapshot at startup, and the UI shows that timestamp as the baseline freshness indicator. A manual refresh is additive and only runs when the operator clicks the header action.

**Rationale:** This keeps the current low-noise behavior while making stale data obvious and actionable.

**Alternative considered:** Replace startup lookup with lazy-only lookup on first open. Rejected because the existing startup snapshot already supports badge/toast behavior and gives the UI immediate data.

### 2. Expose manual refresh through a dedicated API trigger, not by overloading GET

**Decision:** Add a dedicated API route for manual refresh that calls the existing `versionSnapshotService.refresh()` and returns the refreshed snapshot. The existing GET route continues to return the current cached snapshot.

**Rationale:** GET remains a cheap read of the current state, while manual refresh becomes an explicit operator action with clear semantics.

**Alternative considered:** Make `GET /api/version-status` always refresh before responding. Rejected because it would turn passive reads into network/CLI work, make page loads slower, and blur the distinction between startup snapshot and operator-triggered refresh.

### 3. Pair checked-at metadata and refresh action in the header

**Decision:** The Versions section header shows the most recent check timestamp on the right side, directly before an icon-only refresh button.

**Rationale:** This layout keeps the section title/description intact while visually coupling “when was this checked?” with “check again now”. It also matches the user's preferred placement.

**Alternative considered:** Put the timestamp inside the section body or below the title. Rejected because the freshness cue should be visible without scrolling into the section content.

### 4. Keep one loading state across startup and manual refresh

**Decision:** The existing store-level `loading` state remains the single source of truth. The refresh button is disabled while loading, and the header action swaps to a spinner icon during manual refresh or initial snapshot fetch.

**Rationale:** A single in-flight concept matches the server's deduplicated snapshot service and avoids a second “manual refresh only” state machine.

**Alternative considered:** Separate initial-load and manual-refresh loading states. Rejected because it adds complexity without a clear UX benefit for a single shared snapshot.

## Risks / Trade-offs

- **Risk:** operators may assume the timestamp always reflects a successful lookup for every field.  
  **Mitigation:** keep existing tool-level unavailable/error states visible; the timestamp only indicates when the snapshot was last rebuilt.
- **Risk:** repeated manual clicks could hammer npm/CLI lookups.  
  **Mitigation:** rely on the existing server-side in-flight deduplication and disable the button while loading.
- **Trade-off:** the header becomes slightly denser.  
  **Accepted because:** the timestamp + refresh action directly improve interpretability of the Versions page.

## Migration Plan

1. Add a versions-page spec delta for manual refresh and checked-at header behavior.
2. Expose the server refresh path and update the frontend version status store to use it.
3. Add the header timestamp plus refresh button to Settings > Versions.
4. Verify UI behavior for startup snapshot, manual refresh, and lookup failure states.

No data migration is required.
