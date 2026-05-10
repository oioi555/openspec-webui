## Why

The Validation Explorer header currently spends scarce sidebar space on explanatory text and a status badge near the title, but the operator most needs a compact overview of validation health and direct access to validation settings. After validation status semantics are clarified, the header should show actionable controls and compact file-status counts rather than prose.

## What Changes

- Simplify the Validation Explorer header title row.
- Replace the title-adjacent status badge with a small settings button that opens the Validation section of Settings.
- Move descriptive guidance from always-visible text into the Run Validate button tooltip or accessible description.
- Show compact color-coded failed / warning / info counts after a validation run.
- Preserve Run Validate behavior, last-run metadata, loading state, and persistent panel behavior.
- Reserve layout space for possible future filtering without implementing filters now.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `explorer-pane`: Redesign the persistent Validation panel header layout.
- `settings-view`: Allow the Validation Explorer header to open Settings directly to the Validation section.
- `validation`: Consume clarified file-status counts for compact header health indicators while keeping issue severity counts as a separate concept.

## Impact

- Affected components include `frontend/src/lib/components/shared/explorer-section/validation-explorer-section.svelte`, Settings navigation/state, and validation summary/count helpers.
- This change assumes the validation status semantics from `clarify-validation-status-semantics`, especially distinct failed/warning/info counts.
