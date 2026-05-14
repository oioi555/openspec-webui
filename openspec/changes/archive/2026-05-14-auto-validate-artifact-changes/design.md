## Context

The WebUI already exposes full project validation through `POST /api/validate`, normalizes `openspec validate --all [--strict] [--concurrency <n>] --json`, and stores the latest result in `validationStore`. The Validation panel can auto-run validation when opened with no current result, and the same result powers inline status cards in spec/change viewers plus compact icons in Explorer rows.

The missing behavior is lifecycle-oriented validation. AI-generated changes often arrive as multiple artifact file writes over a short burst, and validation is most useful after those writes settle. The server watcher already classifies file changes under `openspec/specs` and `openspec/changes`, but the current WebSocket refresh message only exposes the refreshed entity and entity id, not the precise file event that caused the refresh. The client therefore cannot reliably distinguish markdown artifact writes from directory-only events or unrelated refreshes.

Archived changes are also currently treated too much like active changes in the viewer: OpenSpec validation ignores archived changes, so inline status on archived change pages can imply a target exists when it does not.

## Goals / Non-Goals

**Goals:**
- Add a distinct artifact-change auto-run preference, separate from Validation-panel-open auto-run.
- Trigger automatic full validation only after precise, relevant artifact file events: markdown add/change/unlink under active `changes/` or canonical `specs/`.
- Debounce bursts of relevant artifact events so multi-file AI artifact creation produces one validation run after writes settle.
- Reuse the existing full validation API and `validationStore.refresh()` path for automatic runs and viewer-level manual re-runs.
- Keep archived changes out of inline validation status and re-run affordances.
- Bring Dashboard active-change row status visibility in line with Explorer active-change rows.

**Non-Goals:**
- No target-specific validation API or target-specific result cache. Viewer re-run controls run full project validation.
- No server-side background validation scheduler. Auto-run remains a browser-local preference.
- No validation status icons for archived change rows or archived change detail pages.
- No attempt to infer when an external AI process has semantically “finished” beyond a quiet-window debounce over relevant file events.

## Decisions

### Extend refresh messages with file-change cause metadata

The server should include optional cause metadata on `data:refresh` messages derived from watcher events:

```ts
cause?: {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path?: string;
}
```

The client will use this metadata only for auto-validation trigger filtering. Existing refresh consumers continue to rely on `entity`, `entityId`, and `data`, so this is non-breaking.

Alternative considered: trigger from `entity === 'changes' || entity === 'specs'` alone. That is simpler but too broad: directory creation, archive moves, or unrelated refreshes could trigger validation without a relevant markdown artifact write. The precise cause metadata matches the user's desired “精密版”.

### Keep artifact-change auto-run as a separate preference

The existing `autoRun` preference describes Validation panel behavior. Artifact-change auto-run is more proactive and can run while the user is looking elsewhere in the UI, so it should be stored as a separate local preference, for example `autoRunOnArtifactChange`.

Alternative considered: reuse `autoRun`. That would surprise existing users who enabled panel auto-run and suddenly get background validation runs after file changes.

### Debounce on the client and run full validation

When `autoRunOnArtifactChange` is enabled and a relevant cause arrives, the client schedules `validationStore.refresh()` after a quiet window. Any additional relevant event resets the timer. The timer should be project-scoped and cancelled/reset when the active project changes.

Relevant events:
- `cause.type` is `add`, `change`, or `unlink`
- `cause.path` points to a markdown file
- `entity` is `changes` for active changes or `specs` for canonical specs

Directory-only events should not directly trigger validation. Archived change file changes should not be treated as validation targets, but archive operations that update canonical `specs/` markdown files will still trigger validation through the `specs` event path.

The validation run remains full project validation. This preserves current result semantics and avoids a partial-result merge model.

### Reuse inline status for manual full re-runs, but hide it for archived changes

`ValidationViewerStatus` should include a compact re-run action that calls `validationStore.refresh()` and uses the existing loading state. Spec detail pages and active change detail pages can expose this control without new APIs.

`ChangeViewer` should render `ValidationViewerStatus` only when the loaded change is active. Archived changes should not render the card because archived changes are ignored by `openspec validate`.

### Dashboard active-change icons use existing validation semantics

Dashboard active-change rows should derive status with the same helpers already used by Explorer active-change rows: `deriveValidationTargetSummary` and `deriveValidationListIconState('active-change', ...)`. This keeps icon visibility rules consistent: active changes may show `passed`, `info`, `warning`, or `failed`; `not-run`, `stale`, and `unknown` remain hidden in compact list rows.

## Risks / Trade-offs

- [Risk] A stream of continuous artifact writes can postpone auto-validation indefinitely. → Mitigation: debounce intentionally waits for quiet; the user can still manually re-run validation from the panel or viewer.
- [Risk] Multiple browser tabs with artifact auto-run enabled could each start validation. → Mitigation: this remains consistent with browser-local preferences; `validationStore.loading` should avoid duplicate runs per tab, and validation is light enough for the local-first workflow.
- [Risk] Archive operations can generate both `changes/archive/...` and `specs/...` events. → Mitigation: ignore archived-change file causes and rely on canonical `specs/` markdown updates to schedule the validation that matters after archive.
- [Risk] File path matching may be platform-sensitive. → Mitigation: use watcher-classified `entity` plus a simple markdown extension check; avoid hard-coding separator-heavy path parsing on the client where possible.
