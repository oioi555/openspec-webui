## Why

Explorer-adjacent surfaces now express the same concepts with different visual vocabularies: dashboard lists use icon boxes, search and validation panels use badges, tab/change views duplicate icon decisions, and archived changes are not consistently distinguishable from active changes. This makes the UI harder to scan and increases maintenance cost whenever a new entity type, validation state, or panel variant is added.

## What Changes

- Centralize visual semantics for OpenSpec entity kinds such as specs, active changes, archived changes, projects, and unknown results.
- Centralize visual semantics for validation severity/status so validation panels and `ValidationViewerStatus` no longer maintain parallel badge/icon rules.
- Align Search and Validation Explorer panels with the shared Explorer visual language while preserving their dedicated panel behavior.
- Distinguish archived changes from active changes in mixed contexts, especially search results and dashboard recent activity.
- Reduce badge-heavy validation presentation by using type/severity indicators for classification and reserving badges for compact counts or state labels.
- Reuse the centralized semantics in dashboard lists, tab labels, change viewers, search results, validation result lists, and `ValidationViewerStatus`.
- No breaking API changes are expected.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `shared-ui-parts`: Add shared semantic indicators/metadata for entity type, validation severity, and validation status presentation.
- `explorer-pane`: Align Search and Validation panels with Explorer visual language and use shared item/type/severity presentation.
- `search`: Distinguish active and archived change results in mixed search output.
- `validation`: Simplify and unify validation panel and `ValidationViewerStatus` presentation using shared severity/status semantics.
- `dashboard-change-sorting`: Preserve mixed Recent Activity behavior while making archived entries visually distinct from active changes.

## Impact

- Affected UI components include `frontend/src/lib/components/shared/explorer-section/search-explorer-section.svelte`, `frontend/src/lib/components/shared/explorer-section/validation-explorer-section.svelte`, `frontend/src/lib/components/shared/ValidationViewerStatus.svelte`, `frontend/src/lib/views/Dashboard.svelte`, `frontend/src/lib/views/ChangeViewer.svelte`, and `frontend/src/lib/components/layout/TabBar.svelte`.
- New or extended shared UI helpers/components are expected under `frontend/src/lib/components/shared/` and/or `frontend/src/lib/` for centralized entity, severity, and status metadata.
- Existing search and validation APIs should remain unchanged unless the implementation chooses to enrich client-side result metadata internally.
