## 1. WebSocket trigger metadata

- [x] 1.1 Extend shared WebSocket refresh types with optional file-change cause metadata containing watcher event type and path.
- [x] 1.2 Include watcher cause metadata when broadcasting file-change-derived `data:refresh` messages from the server.
- [x] 1.3 Add or update server/shared tests proving existing refresh fields remain available and cause metadata is present for watcher events.

## 2. Artifact auto-run preferences and scheduling

- [x] 2.1 Add a persisted browser-local `autoRunOnArtifactChange` validation preference without sending it to the validation API.
- [x] 2.2 Add Settings UI copy and controls for artifact-change auto-run separate from Validation panel auto-run.
- [x] 2.3 Implement client-side filtering for relevant artifact causes: markdown add/change/unlink events under active changes or canonical specs only.
- [x] 2.4 Implement project-scoped debounce scheduling that calls `validationStore.refresh()` once after relevant artifact changes settle and cancels pending work on project switch.
- [x] 2.5 Ensure artifact auto-run does not start duplicate concurrent validation runs while validation is already loading.

## 3. Validation status UI updates

- [x] 3.1 Add Dashboard active-change row validation icons using the same target-summary/list-icon derivation as Explorer active-change rows.
- [x] 3.2 Hide inline validation status and re-run affordances on archived change detail pages.
- [x] 3.3 Add a compact re-run action to inline validation status for specs and active changes that reuses `validationStore.refresh()`.
- [x] 3.4 Reflect validation loading state in inline re-run controls and prevent duplicate re-run starts.

## 4. Verification

- [x] 4.1 Add/update frontend source-assertion or unit tests for preferences, scheduling filters, debounce behavior, Dashboard icons, archived change suppression, and viewer re-run controls.
- [x] 4.2 Run relevant frontend tests and type checks.
- [x] 4.3 Run `openspec validate auto-validate-artifact-changes --strict`.
