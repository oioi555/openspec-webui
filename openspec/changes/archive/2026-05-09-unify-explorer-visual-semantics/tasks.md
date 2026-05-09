## 1. Shared Semantic Layer

- [x] 1.1 Add shared entity visual metadata for spec, active-change, archived-change, project, and unknown entities.
- [x] 1.2 Add shared validation severity metadata for error, warning, and info issue levels.
- [x] 1.3 Add shared validation status metadata for not-run, passed, failed, warning, stale, and unknown states.
- [x] 1.4 Add reusable indicator components or helpers for entity type, validation severity, and validation status using the shared metadata.
- [x] 1.5 Ensure shared indicators expose accessible labels when rendering icon-forward or compact formats.

## 2. Explorer Search Panel

- [x] 2.1 Resolve Search panel `change` results to active-change or archived-change presentation when possible.
- [x] 2.2 Replace local search result badge variant logic with shared entity semantics.
- [x] 2.3 Keep Search result selection, context menu, active-tab highlighting, query preservation, and clear behavior unchanged.
- [x] 2.4 Align Search panel header/count/body row styling with the shared Explorer panel visual language.

## 3. Explorer Validation Panel

- [x] 3.1 Replace local validation failed-item type labels and severity variant logic with shared entity and severity semantics.
- [x] 3.2 Render failed validation items as Explorer-style rows with shared type indicator, name, severity indicator, and issue count.
- [x] 3.3 Replace panel result status presentation with shared validation status semantics.
- [x] 3.4 Preserve validation run action, loading/error states, last-run layout stability, non-navigable item messaging, context menu actions, and item selection behavior.
- [x] 3.5 Align Validation panel header/status/body row styling with the shared Explorer panel visual language.

## 4. Inline Validation Status

- [x] 4.1 Refactor `ValidationViewerStatus.svelte` to use shared validation status metadata for icon, icon-box tone, status label, and badge tone.
- [x] 4.2 Refactor `ValidationViewerStatus.svelte` issue details to use shared severity semantics instead of local issue badge variant logic.
- [x] 4.3 Use shared entity type semantics for the inline target type presentation.
- [x] 4.4 Preserve existing aria labels, collapsible detail behavior, issue count display, last-run metadata, issue path display, and issue message display.

## 5. Dashboard, Tabs, and Change Viewer

- [x] 5.1 Replace duplicated entity icon/tone mapping in Dashboard lists with shared entity semantics.
- [x] 5.2 Make Dashboard Recent Activity archived entries visually distinct from active change entries while preserving mixed ordering and sort behavior.
- [x] 5.3 Replace duplicated entity icon/tone mapping in `TabBar.svelte` with shared entity semantics.
- [x] 5.4 Replace duplicated active/archive change header icon/tone mapping in `ChangeViewer.svelte` with shared entity semantics.

## 6. Verification

- [x] 6.1 Run the frontend typecheck/build validation used by the project and fix any type or Svelte errors.
- [x] 6.2 Manually verify Search panel results show distinct spec, active-change, archived-change, project, and unknown presentations where data is available.
- [x] 6.3 Manually verify Validation panel and `ValidationViewerStatus` show reduced badge clutter while preserving status, counts, details, and interactions.
- [x] 6.4 Manually verify Dashboard Recent Activity, TabBar, and ChangeViewer still render the correct icons and archived/active distinction.

## 7. Icon-Box-First Refinement

- [x] 7.1 Prefer compact icon-box indicators over text micro-badges in sidebar search results.
- [x] 7.2 Rework validation failed-item rows so entity icon box plus filename are first, with failed target status and issue count on the next line.
- [x] 7.3 Simplify `ValidationViewerStatus.svelte` so main viewer status does not repeat entity type and issue count styling aligns with validation list treatment.
- [x] 7.4 Re-run typecheck/build validation after the refinement.
