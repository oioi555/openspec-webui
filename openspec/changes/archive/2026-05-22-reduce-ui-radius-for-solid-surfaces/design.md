## Context

The UI currently mixes multiple rounded layers in the same surfaces. In Dashboard and Settings, large rounded section cards contain rounded interactive cards, rounded option cards, rounded callouts, rounded icon boxes, pill badges, and sometimes nested rounded inset panels.

```txt
Current visual stack

rounded outer section
└─ rounded inner item
   ├─ rounded icon box
   ├─ rounded pill badge
   └─ hover lift + shadow
```

After Explorer default sections moved toward a flush list style, this stacked rounding feels heavier. The desired direction is a more solid tool UI: outer shells may remain softly rounded, but inner content should rely on straight separators, borders, and background states.

## Goals / Non-Goals

### Goals

- Establish a simple radius hierarchy for shared surfaces.
- Reduce nested rounding in Dashboard and shared primitives.
- Make Dashboard Active Changes and Recent Activity feel more solid inside section shells while preserving the bounded grouping needed by compound Active Changes task rows.
- Bring Callout, OptionCard, and Settings page inner surfaces into the same reduced-radius hierarchy.
- Reduce hover translation/shadow where it contributes to a floaty card feel.
- Preserve existing behavior, accessibility, content, localization, and data semantics.

### Non-Goals

- Do not change data loading, sorting, validation, command shortcut, context menu, or tab navigation behavior.
- Do not redesign color tokens or typography beyond what is necessary for solid surfaces.
- Do not make the entire application square; major containers should still have enough radius to feel intentional.

## Decisions

### D1: Use radius hierarchy instead of global radius removal

**Decision:** Adopt a hierarchy where major containers may use modest radius, while inner rows/items use smaller radius or no radius.

```txt
Major shell / dialog / section     modest radius
Nested panel / summary card        small-to-modest radius
Compound task item                 small radius with a bounded surface
Inner list row / dashboard item    none or very small radius when the row is single-level
Badge / chip / icon box/callout    small radius unless semantic pill is required
```

**Rationale:** This preserves grouping and avoids a harsh square UI while removing the visual clutter caused by card-in-card rounding.

### D2: Dashboard list content should become solid inside section shells, with bounded task cards for compound rows

**Decision:** Dashboard Recent Activity should use restrained list tiles within its outer `SurfaceCard` shell. Dashboard Active Changes should use a bounded solid task-card stack: each change item keeps a small-radius bordered surface and modest inter-item gap because it contains both a main row and a `Next Step` sub-row.

**Rationale:** The Dashboard is information-dense, but Active Changes items are compound controls. A fully flush Active Changes list makes the internal `Next Step` separator visually compete with item boundaries. The bounded task-card stack keeps the solid direction without losing the parent/child relationship between a change and its next-step actions.

```txt
Preferred direction

╭──────────────────────────────╮
│ Active Changes               │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ change main row          │ │
│ ├──────────────────────────┤ │
│ │ Next Step sub-row        │ │
│ └──────────────────────────┘ │
│ gap                          │
│ ┌──────────────────────────┐ │
│ │ change main row          │ │
│ ├──────────────────────────┤ │
│ │ Next Step sub-row        │ │
│ └──────────────────────────┘ │
╰──────────────────────────────╯
```

### D3: Hover states should be grounded

**Decision:** Prefer background/border changes over translate/shadow lift for dense dashboard and list surfaces.

**Rationale:** Hover lift works for marketing or sparse cards, but inside dense management UI it makes nested elements feel busy and bouncy.

### D4: Shared primitives should encode the direction

**Decision:** Where possible, update shared primitives or their supported variants so future surfaces can choose `shell`, `item`, or equivalent radius/interaction density without local ad-hoc class overrides.

**Rationale:** If only Dashboard classes are patched, future usage of `Card`/`InteractiveCard`/`Badge`/`IconBox` will reintroduce inconsistent rounding. The base `Card` default should therefore use the outer-shell radius level rather than an extra-large radius; wrappers can still override radius when they need a more specific shell or item treatment.

### D5: Settings and callouts use the same inner-surface hierarchy

**Decision:** `Callout` uses small-radius alert surfaces; `OptionCard` uses medium-radius selection cards with a non-circular icon container and no scale hover; Settings navigation buttons, grouped list wrappers, preview-tab rows, and inline command/code containers use medium or small radius according to their nesting depth.

**Rationale:** Settings is a dense control surface similar to Dashboard. Keeping large rounded option cards, rounded callouts, circular icon containers, and playful scale hover effects would undermine the solid surface direction even if Dashboard is corrected.

## Risks / Trade-offs

- **Too severe:** Reducing all radius equally could make the app feel unfinished. Keep outer shell radius.
- **Regression through shared defaults:** Changing shared primitive defaults may affect settings, dialogs, or other surfaces unexpectedly. Use variants or targeted defaults where needed.
- **Loss of click affordance:** Removing card chrome from rows can make items look less clickable. Mitigate with hover background, focus ring, cursor, and clear row layout.
- **Responsive layout differences:** Recent Activity currently uses a card grid; a row-like treatment must still work in multi-column layouts or intentionally change the layout.
- **Separator ambiguity in compound rows:** Active Changes has a `Next Step` sub-row, so it needs bounded item surfaces or differentiated internal separators rather than a fully flush list.
- **Settings selection affordance:** Reducing `OptionCard` roundness and removing icon scale hover must preserve selection clarity through border weight, selected background, and hover border/background treatment.

## Validation Plan

- Verify Dashboard summary cards, bounded Active Changes task cards, Recent Activity, and Planning Context visually follow the radius hierarchy.
- Verify Callout, OptionCard, and Settings grouped controls follow the same reduced-radius treatment.
- Verify Explorer, Search, and Validation remain coherent with the solid direction.
- Verify clickable rows retain hover/focus affordances and keyboard accessibility.
- Verify light and dark themes maintain sufficient contrast.
- Run relevant frontend tests and `npm run build`.
