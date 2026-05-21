## Context

The default Explorer Pane currently renders Active Changes, Archive, and Specs as a vertical stack of rounded `ExplorerSection` cards inside a padded scroll area:

```txt
ScrollArea
└─ p-3 space-y-4
   ├─ rounded Active Changes card
   ├─ rounded Archive card
   └─ rounded Specs card
```

Search and Validation use a different pattern: a full panel with a header and a flush, full-width list of border-separated rows. That pattern is denser and gives long labels more usable width.

## Goals / Non-Goals

### Goals

- Make Active Changes, Archive, and Specs visually align with Search and Validation list readability.
- Recover horizontal row width by removing card stack padding/gaps.
- Preserve section-level organization, collapse/expand controls, sort controls, command shortcuts, empty states, and current navigation behavior.
- Keep the change visual/layout focused; no data model, API, parser, validation, or search behavior changes.

### Non-Goals

- Do not redesign Search or Validation panels.
- Do not change Explorer item semantics, context menu actions, tab-opening behavior, or validation-status rules.
- Do not add sticky section headers in this change unless implementation proves it is trivial and non-disruptive.

## Decisions

### D1: Use a flush section list rather than tighter cards

**Decision:** The default Explorer group will move from separated cards to adjacent full-width sections with subtle separators.

**Rationale:** Tightening card spacing would preserve some current structure but would not fully address the width and consistency concerns. A flush list directly matches the user-preferred Search/Validation surfaces.

```txt
Before
┌────────────────────────┐
│ Active Changes      3  │
├────────────────────────┤
│ row                    │
└────────────────────────┘

┌────────────────────────┐
│ Archive             8  │
├────────────────────────┤
│ row                    │
└────────────────────────┘

After
──────────────────────────
▾ Active Changes       3
──────────────────────────
row
row
──────────────────────────
▾ Archive              8
──────────────────────────
row
```

### D2: Preserve section headers as the main wayfinding mechanism

**Decision:** Removing card boundaries must be offset by stronger section headers: full-width background/separator treatment, uppercase title, icon, count badge, sort control, and chevron remain visible.

**Rationale:** Without spacing, adjacent section bodies can visually merge. Headers become the primary boundary and should remain scannable.

### D3: Focus styling moves from card ring to header/accent styling

**Decision:** Programmatic section focus should remain visible, but it should not depend on a rounded card container. Prefer a header tint, left accent, or similarly flush-list-friendly state.

**Rationale:** The current card ring communicates focus at the container level. In a flush list, a header/accent state is less visually noisy and does not require restoring card chrome.

### D4: Keep item component behavior unchanged

**Decision:** `ExplorerSectionItem` and `ExplorerListItemButton` should continue to provide the shared row pattern for Active Changes, Archive, Specs, Search, and Validation where possible. The change should focus on wrapper/header styling rather than row behavior.

**Rationale:** The rows already share the desired border-separated list item component. Changing row behavior would increase regression risk without addressing the core problem.

## Risks / Trade-offs

- **Section boundary loss:** Removing gaps can make the default Explorer read as one continuous list. Mitigate with stronger full-width headers and separators.
- **CommandShortcutBar placement:** Active Changes has `headerExtra`; it must remain visually attached to that section and not look like a global toolbar.
- **Focused-section discoverability:** The previous card ring will no longer fit. Tests and manual review should verify the replacement focus state is visible.
- **Empty state containment:** Empty states need enough padding and separation to remain understandable without a surrounding rounded card.

## Validation Plan

- Verify Active Changes, Archive, and Specs render as adjacent full-width sections in the default Explorer view.
- Verify Search and Validation panels are unchanged.
- Verify collapse/expand and Activity Bar presets still work.
- Verify long names have more horizontal room at narrow widths.
- Run frontend tests and `npm run build`.
