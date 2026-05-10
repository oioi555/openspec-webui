## Context

The Search panel already preserves the current query while operators open specs and changes in the Main Viewer. That makes it a natural source of truth for lightweight in-page highlighting: the sidebar handles screening, the viewer shows detail, and the highlight simply answers "where in this markdown did the query hit?"

This change is intentionally narrow. The user wants a quick visual cue, not a full document-search feature. That means no next/previous navigation, no current-match concept, no extra viewer toolbar, and no separate Settings control. The Search panel itself should own the toggle.

## Goals / Non-Goals

**Goals:**
- Add a simple Search-panel toggle for in-page highlighting.
- Persist the toggle state locally so operators can leave it off if it feels noisy.
- Highlight all literal matches of the current valid search query inside rendered markdown viewers.
- Keep the visual language consistent by using the warning/highlighter tone for both the toggle and the marks.
- Apply the behavior uniformly to specs, change documents, and change spec deltas that render through the shared markdown path.

**Non-Goals:**
- No next/previous controls.
- No current-match counter or current-match styling.
- No highlighting of filenames, result-row previews, viewer headers, metadata rows, or non-markdown surfaces.
- No server-side search changes or ranking changes.
- No Settings-page preference for this feature.

## Decisions

### 1. The Search panel owns the toggle

**Decision**: Add the highlight control to the top area of the Search panel header using the `Highlighter` icon. When enabled, the control uses warning-tone styling. The existing redundant result-count badge can be removed because Search already surfaces result status elsewhere.

**Rationale**: The feature belongs to search workflow, not global application settings. Operators should be able to switch it on or off right where they are screening search results.

**Alternative considered**: Put the preference in Settings. Rejected because it adds navigation friction for a lightweight, context-specific behavior.

### 2. Persist one global on/off preference

**Decision**: Store one locally persisted boolean preference for viewer query highlighting and restore it when the UI starts again.

**Rationale**: The user explicitly wants a simple permanent off-switch if highlighting becomes distracting. A single boolean keeps behavior predictable.

**Alternative considered**: Per-tab or per-document highlight state. Rejected because it adds state complexity without matching the user's request.

### 3. Highlight the literal query string across markdown body content only

**Decision**: Treat the current search query as one literal string and highlight all exact string matches inside rendered markdown body content when the query is valid (the same minimum length as Search itself). Matching is case-insensitive to stay aligned with current Search semantics, but the original document text remains unchanged.

**Rationale**: This is the simplest rule for operators to understand: if the visible search query appears in the markdown body, it lights up everywhere.

**Alternative considered**: Split the query into tokens or add fuzzy/high-ranked per-word highlighting. Rejected because it would create surprising visual noise and drift away from the "simple screening aid" goal.

### 4. No metadata-only highlight

**Decision**: Search results can still come from filenames, names, or paths, but in-page highlight only appears when the current query also exists in the rendered markdown body.

**Rationale**: Operators already see filename/path matches in the Search results list. Adding fake in-page highlighting when the body does not contain the term would be misleading.

**Alternative considered**: Highlight viewer titles or tab labels for metadata-only matches. Rejected because the user specifically wants markdown-body guidance.

### 5. Use the shared markdown rendering path

**Decision**: Implement the behavior in the shared markdown-rendering flow used by both `SpecViewer` and `ChangeViewer`, including change spec deltas.

**Rationale**: One rendering path gives consistent behavior across all markdown surfaces and keeps the feature simple.

**Alternative considered**: Add separate highlight logic in each viewer. Rejected because it would increase drift and duplicate the same rules.

## Risks / Trade-offs

- **Too much highlight noise on dense documents** → the persistent toggle gives an immediate escape hatch.
- **Unsafe HTML mutation after markdown render** → implementation must avoid corrupting tags/attributes when inserting marks.
- **Async content/tab switches leave stale marks behind** → highlight recomputation should be driven by content, query, and toggle state together.
- **Warning tone competes with diff highlighting** → verify the mark color stays visible without obscuring existing change-delta semantics.

## Open Questions

- None for proposal scope. The requested behavior is intentionally simple enough to proceed directly.
