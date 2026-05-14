## Why

Dashboard validation icons should communicate completion at the moment AI-generated artifacts finish and validation runs, but the current Dashboard placement puts the Active Changes icon away from the title/badge progression and Recent Activity still ends rows with a navigation arrow instead of validation state. Operators use the appearance of proposal/design badges during change creation as progress cues, so the validation icon should appear as the final left-aligned cue in that sequence.

## What Changes

- Move Dashboard Active Changes validation icons into the title row immediately after the change name, Proposal badge, and Design badge.
- Remove the trailing arrow icon from Dashboard Active Changes rows.
- Add compact validation status icons to Dashboard Recent Activity rows for active changes and specs using existing validation status semantics.
- Remove the trailing arrow icon from Dashboard Recent Activity rows and reserve the right edge for a right-aligned validation icon when one is available.
- Keep archived change Recent Activity rows without validation icons because archived changes are not OpenSpec validation targets.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `validation`: Refines Dashboard validation status placement and extends compact validation status visibility to Recent Activity.

## Impact

- `frontend/src/lib/views/Dashboard.svelte` row layout and validation-status derivation for Active Changes and Recent Activity.
- Dashboard source-assertion tests covering Active Changes and Recent Activity visual semantics.
- No API or validation execution behavior changes.
