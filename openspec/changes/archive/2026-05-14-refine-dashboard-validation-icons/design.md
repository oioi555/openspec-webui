## Context

The previous validation work added compact validation status to Dashboard Active Changes, but the placement currently separates the status icon from the title and creation-progress badges. Operators watch the Dashboard while AI workflows create artifacts: the change name appears first, then Proposal and Design badges appear as files are created, and validation status should be the final cue in that same left-aligned sequence.

Dashboard Recent Activity still uses a trailing arrow affordance. With validation status now communicating the actionable state of active changes and specs, the right side of recent activity rows is better used for compact validation status. Archived changes remain non-validation targets.

## Goals / Non-Goals

**Goals:**
- Make Active Changes validation status part of the left-aligned title/badge sequence: title, Proposal badge, Design badge, validation icon.
- Remove trailing arrow icons from Dashboard Active Changes rows.
- Add compact validation status to Dashboard Recent Activity rows for active changes and specs.
- Remove trailing arrow icons from Recent Activity rows and right-align validation icons there.
- Preserve existing click behavior and context menu behavior for Dashboard rows.

**Non-Goals:**
- No changes to validation execution, auto-run scheduling, API behavior, or validation result semantics.
- No validation icons for archived changes.
- No redesign of Explorer rows; this change is scoped to Dashboard row layout.

## Decisions

### Active Changes uses title-row status placement

Active Changes rows should render validation status in the same flex row as the change title and badges. The order is normative:

```text
change name → Proposal badge → Design badge → validation icon
```

This supports the operator's mental model that validation status appears after artifact creation signals complete. The existing right-side progress section remains focused on task progress, and the trailing arrow is removed.

Alternative considered: keep the validation icon on the far right. That makes the status visually consistent with row actions but weakens the “final artifact creation cue” that operators use while watching AI-generated changes appear.

### Recent Activity uses right-aligned status in place of arrows

Recent Activity rows mix entity types and have less room for title-row badges. Their trailing arrow should be removed and replaced by a right-aligned compact validation status when the item is a validation target with an actionable compact state.

Status derivation should follow existing semantics:
- active changes: `deriveValidationListIconState('active-change', targetState)`
- specs: `deriveValidationListIconState('spec', targetState)`
- archived changes: no validation status

When no compact validation icon is available, the right edge remains empty rather than showing a navigation arrow.

### Preserve row affordance through card/button behavior

Removing the arrow icons should not reduce navigability. The whole row button remains clickable, hover styles remain available through `InteractiveCard`, and context menus continue to expose open actions.

## Risks / Trade-offs

- [Risk] Removing arrows may make rows look less explicitly navigable. → Mitigation: preserve button/card hover styling and full-row click behavior.
- [Risk] Title-row validation icons may wrap awkwardly on narrow Active Changes rows. → Mitigation: keep the icon in the existing wrapping title/badge flex group and make it non-growing/shrink-safe.
- [Risk] Recent Activity rows without validation status lose the old trailing visual marker. → Mitigation: this is intentional; archived/non-actionable items should not imply validation state or a separate navigation action.
