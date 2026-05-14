## Why

Validation status is most useful immediately after AI or agent workflows create or update OpenSpec artifacts, but today automatic validation only starts when the Validation panel opens from a clean state. Operators also see validation status on archived change detail pages even though archived changes are ignored by `openspec validate`, and Dashboard active-change rows lack the compact validation status already available in Explorer rows.

## What Changes

- Add a separate validation preference that automatically runs full project validation after relevant OpenSpec artifact file changes settle.
- Treat relevant artifact changes precisely: markdown file add/change/unlink events under active `changes/` and canonical `specs/` should schedule a debounced full validation run; directory-only events or unrelated project files should not directly trigger artifact auto-validation.
- Preserve the existing Validation panel auto-run setting as a panel-open behavior rather than overloading it with artifact-change behavior.
- Show compact validation status icons on Dashboard active-change list items using the same semantics as Explorer active-change rows.
- Hide inline validation status on archived change detail pages because archived changes are not validation targets.
- Add a manual re-run control to inline validation status surfaces for specs and active changes; it reuses the existing full validation flow, equivalent to the Validation panel refresh button.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `validation`: Adds precise artifact-change auto-run behavior, dashboard active-change status icons, archived-change status suppression, and viewer-level full validation re-run affordances.

## Impact

- Frontend validation preferences, validation store orchestration, Dashboard active-change rows, inline validation status UI, and ChangeViewer archived-state rendering.
- WebSocket/data refresh payloads from the server may need to include file change cause metadata so the client can distinguish markdown add/change/unlink events from directory-only or unrelated refreshes.
- Server shared WebSocket types and file change broadcasting may be extended with non-breaking metadata.
