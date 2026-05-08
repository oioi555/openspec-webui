## Why

The Validation panel can identify which specs and changes are invalid, but once an operator opens the affected document they still need nearby validation context while comparing errors to the file content. Inline viewer status keeps issue details close to the document without replacing the document's existing tabs or forcing operators to scroll away from them.

## What Changes

- Add compact validation status bars to SpecViewer and ChangeViewer.
- Place each status bar above the viewer's document tabs/content area so it remains visible while the document tabs stay immediately below for comparison.
- Show pass/fail/unknown/stale state for the current spec or change using the latest validation result from V1.
- Provide a collapsible Details area that lists validation messages for the current item.
- Do not add a bottom details panel, right sidebar, standalone validation route, or new tab type.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `spec-browsing`: Show current-spec validation status and collapsible details in the SpecViewer.
- `change-browsing`: Show current-change validation status and collapsible details in the ChangeViewer.

## Impact

- `frontend/src/lib/components/viewers/SpecViewer.svelte` or current spec viewer location — Add validation status bar above spec content.
- `frontend/src/lib/components/viewers/ChangeViewer.svelte` or current change viewer location — Add validation status bar above change document tabs/content.
- Shared validation UI component — Optional extraction for status bar and details list.
- Frontend validation state from V1 — Read latest result and derive per-item status.
- Tests for status derivation, placement relative to document tabs/content, and details toggle behavior.
