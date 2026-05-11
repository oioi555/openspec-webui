## Context

The Dashboard Active Changes surface in `frontend/src/lib/views/Dashboard.svelte` diverges from nearby dashboard panels in two ways:

1. The section container uses a stronger `SurfaceCard` shadow than the surrounding dashboard sections.
2. Each change row combines an `InteractiveCard` hover transform with a split layout: a primary summary area followed by a `Next Step` command row. The full row looks like one interactive card, but only the upper summary area currently opens the change. That makes the lower `Next Step` row feel broken when the operator clicks its background or label rather than a command chip.

The intended behavior is already clear elsewhere in the UI:

- dashboard section cards should feel like peers unless a stronger emphasis is deliberate
- command chips in Dashboard Active Changes should remain a separate interaction lane and should not open the change
- clicking the card background, summary content, or `Next Step` row label/background should open or focus the change

## Decisions

### 1. Normalize the section surface shadow

The Active Changes section should use the same shared section-level shadow weight as peer dashboard panels rather than carrying a locally stronger elevation.

This keeps the Dashboard section stack visually consistent and avoids implying that Active Changes is a different surface type.

### 2. Remove the lower-edge ambiguity from the row interaction

The full Active Changes card surface should behave as a stable click target, including the lower metadata/progress line and the `Next Step` row background/label area.

The fix should preserve the existing hover lift used by neighboring dashboard items while making the lower row feel like part of the same clickable card.

Conceptually:

```text
Active change card
┌─────────────────────────────────────────────┐
│ primary summary action                     │
│ name / badges                              │
│ metadata / progress  ← fully clickable     │
├─────────────────────────────────────────────┤
│ Next Step row bg/label  ← opens detail     │
│ command chips          ← separate actions  │
└─────────────────────────────────────────────┘
```

### 3. Preserve command-row semantics

The `Next Step` row remains visually separate, but only the command chips themselves should be excluded from navigation. Clicking the rest of that row should still open the change. The fix should not change which commands appear.

## Risks and Checks

- ensure command chips stop event propagation so they do not also trigger row navigation
- preserve visual separation between the main summary region and the command row while keeping the shared hover lift
- verify rows without command chips still keep the intended clickable behavior
- keep the change scoped to dashboard presentation and interaction; no API, parser, or store contract changes are expected
