## Why

`highlight-search-query-in-viewers` makes matched text visible inside open markdown, but it still leaves one major usability gap: operators have to manually discover which document inside a change contains the hit. That is manageable for standalone specs, but much weaker for changes that split content across `proposal.md`, `design.md`, `tasks.md`, and multiple spec deltas.

We want search result navigation to feel intentional: when a result opens, the viewer should land on the first relevant hit automatically. For changes, the UI should also indicate which top-level document tabs contain hits, and spec deltas that contain hits should auto-expand so the operator does not have to hunt through collapsed sections.

## What Changes

- extend Search result metadata so change hits can identify the first matching document and matching spec delta capability when applicable
- when opening a Search result, route the viewer to the first matching markdown document and scroll to the first highlighted match
- for change hits, show warning-tone hit indicators on top-level document tabs that contain at least one hit
- for change spec delta hits, automatically open the Spec Deltas tab and expand the matching delta sections on initial navigation
- keep the behavior focused on opening/search navigation rather than adding next/previous controls or a full document-search UI

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `search`: Search results carry enough hit-location metadata to route viewers to the first matching markdown document within a change.
- `spec-browsing`: SpecViewer scrolls to the first highlighted match when opened from Search with a markdown-body hit.
- `change-browsing`: ChangeViewer opens the first matching document tab, indicates which top-level documents contain hits, auto-expands matching spec deltas, and scrolls to the first highlighted match.

## Impact

- Affected shared search contracts include parser output, shared `SearchResult` typing, and frontend search result handling.
- Affected frontend navigation includes `searchStore.openResult`, viewer state handoff, and Main Viewer initialization behavior.
- Affected change-view UI includes top-level tab indicators and initial delta expansion behavior for Search-driven navigation.
- Regression coverage should verify first-hit routing, metadata-only fallback behavior, and auto-expansion/scroll behavior for matching spec deltas.
- No database or CLI workflow changes are expected.
