## Context

The previous change added lightweight in-page highlighting driven by the current Search query. That solves “can I see the hit once I’m there?” but not “where should I land when I open the result?”

The current Search contract is too coarse for that job. Search results identify a change as a whole, but they do not identify which markdown document inside the change matched. The parser currently searches only proposal body content for changes, so design/tasks/spec delta hits are invisible to the open-result flow even though ChangeViewer can render all of those documents.

This follow-up narrows in on navigation quality rather than adding full document-search controls. The goal is to make search-opened viewers land in the right place immediately.

## Goals / Non-Goals

**Goals:**
- Add enough Search result metadata to identify the first matching markdown document inside a change.
- Open Search results directly into the first matching document and scroll to the first highlighted match.
- Show which change top-level tabs contain hits.
- Auto-expand matching spec deltas when a Search result opens the Spec Deltas area.
- Reuse existing viewer-state/navigation patterns rather than inventing fragment routing.

**Non-Goals:**
- No next/previous hit controls.
- No persistent per-hit navigator UI inside viewers.
- No re-ranking or fuzzy search changes.
- No highlight indicators for filenames, result-row excerpts, or non-markdown surfaces.
- No URL hash/fragment navigation model.

## Decisions

### 1. Extend SearchResult with first-hit routing metadata

**Decision**: Add structured metadata to change results so the frontend can identify the first matching target within a change. This includes which top-level document group matched, which file within that group matched, and which spec delta capability matched when relevant.

**Rationale**: The existing `matchLine` field alone is not enough because it is only meaningful once the correct document is already open.

**Alternative considered**: Infer the first hit client-side after opening a change. Rejected because the necessary per-document hit information is only known during search and would require re-running document search logic in the viewer.

### 2. Use viewer state, not URL fragments, to hand off hit navigation

**Decision**: Reuse the existing `tabStore` viewer-state mechanism to pass one-shot search navigation hints into SpecViewer and ChangeViewer.

**Rationale**: This app already uses viewer state for internal navigation such as Settings section targeting. It avoids introducing a new routing model and keeps search-open behavior internal to the existing tab system.

**Alternative considered**: Add `#fragment` or query-string routing for hit targets. Rejected because the current app does not use fragment routing and change viewer state is already tab-instance specific.

### 3. Scroll only after the matching markdown is rendered

**Decision**: Search-driven auto-scroll happens after the target markdown document is active and rendered with highlight marks. The viewer should then scroll the first `<mark>` into view.

**Rationale**: The viewer already knows how to render highlight marks, so scrolling to the first rendered mark keeps the logic simple and consistent with what the operator sees.

**Alternative considered**: Scroll by raw line number without regard to rendered marks. Rejected because markdown rendering changes layout and because spec delta collapsibles need expansion first.

### 4. Change top-level tabs show hit presence, not hit counts

**Decision**: Use warning-tone hit-presence indicators (for example a highlighter icon or dot) on `proposal`, `design`, `tasks`, and `spec-deltas` top-level tabs, while spec delta section headers show warning-tone hit counts.

**Rationale**: Top-level tabs already use badge space for existing semantics. Presence is the key question at that level: “does this document contain a hit?” Count detail is more useful within the spec-delta list itself.

**Alternative considered**: Show numeric hit-count badges on top-level tabs. Rejected because it competes with existing tab-badge semantics and makes the tabs visually busier.

### 5. Auto-expand only matching spec deltas on Search-opened navigation

**Decision**: When the first matching target is a spec delta, ChangeViewer opens the Spec Deltas tab and auto-expands only the delta sections that contain hits for that search result.

**Rationale**: This surfaces the relevant content immediately without exploding the whole list of deltas.

**Alternative considered**: Expand every spec delta or leave them all collapsed. Rejected because both extremes hurt scan efficiency.

## Risks / Trade-offs

- **Search contract growth** → keep new metadata narrowly scoped to routing and tab indicators rather than exposing a full match tree.
- **Viewer-state complexity** → treat search navigation hints as one-shot requests with request keys so they do not keep re-triggering on unrelated rerenders.
- **Metadata-only matches with no body hit** → preserve current open behavior without fake scrolling or false hit indicators.
- **Spec delta open-state conflicts with manual usage** → auto-expansion should only happen on Search-driven initial navigation, not on every rerender.

## Open Questions

- Whether the top-level hit presence indicator should be a `Highlighter` icon or a small warning dot can be decided during implementation, but it should remain non-numeric.


---

## Revisions

| 日期 | 类型 | 变更描述 | 原因 | 影响 API |
|------|------|----------|------|----------|
| 2026-05-10 | behavior | Added ActivityBar search highlight-state indicator and clarified that hit indicators only render while highlight mode is enabled | User requested a persistent search-button state cue and found existing hit indicators stayed visible after turning the highlight toggle off | - |
