# Design: Compact Store Navigation

## Context

The Dashboard's Store Relationship Card currently renders pointer store and references in a single expanded card with equal visual weight. This design addresses space pressure, visual hierarchy, and mobile usability issues while preserving quick access to both store types.

**Current state**: Single `SurfaceCard` with pointer store description + path + Open button, followed by full reference list with label + storeId + path + Open button per item. Total height: ~400px for 10 references.

**Target state**: Single compact relationship navigation bar — pointer status with direct Open action and references count/expand trigger coexist on one line. Narrow widths may wrap when needed; expanded reference list drops below the bar.

## Goals

1. **Preserve Dashboard placement**: Store relationship remains at top of Dashboard, above Summary Cards
2. **Visual hierarchy**: Pointer store (1:1, primary work destination) gets prominence; references (1:many, auxiliary) stay accessible but non-intrusive
3. **Space efficiency**: Collapsed state uses a single relationship navigation bar (~40px vs ~400px)
4. **Mobile-first**: Single-line bar; action or references trigger wraps only when necessary
5. **Zero API changes**: No modifications to storeHelpers, ProjectSelector, or data structures

## Non-Goals

- Changing store discovery logic or resolution behavior
- Modifying `resolveStoreRelationship()` or `mergeUnifiedProjectList()`
- Altering ProjectSelector overlay behavior
- Adding new UI component patterns beyond existing Collapsible

## Decisions

### 1. Relationship Navigation Bar: Single-Line Compact Display

**Decision**: Render pointer store and references trigger as a single relationship navigation bar at Dashboard top, not as separate card sections.

**Rationale**: 
- Pointer store is a 1:1 relationship — the primary work destination
- References are 1:many — auxiliary, collapsed by default
- Single bar eliminates section fragmentation and reduces vertical footprint

**Layout (collapsed — default)**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🏪 my-store  [Open Planning Store]      ▶ References (3)               │
└─────────────────────────────────────────────────────────────────────────┘
```

- Pointer icon: `Store` from lucide, `text-primary` color
- Pointer label: Store label from `mergedRows` (not storeId)
- Pointer action: `Button variant="default" size="sm"` — visually prominent
- Pointer status: If store is unavailable/unresolved, show inline status badge instead of hiding
- References trigger: Collapsed count badge with chevron (see Decision 2)
- Remote field: The `remote` field in `references` object entries (`{ id, remote }`) is ignored — only `id` is used for display, resolution, and validation. CLI discovery records are displayed as before.

**Narrow/mobile wrap**: When viewport is too narrow, the references trigger wraps below the pointer line:
```
┌─────────────────────────────────┐
│ 🏪 my-store  [Open Planning]   │
│ ▶ References (3)                │
└─────────────────────────────────┘
```

### 2. References: Collapsed by Default with Count Badge

**Decision**: References section uses `Collapsible` component, collapsed by default. Shows count badge in trigger. The trigger lives inside the same relationship navigation bar as the pointer store.

**Rationale**:
- References are 1:many (up to 10+), auxiliary information
- Collapsed state eliminates space consumption
- Count badge provides quick scan of reference volume
- Expand on demand preserves access

**Layout (collapsed — within the bar)**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🏪 my-store  [Open Planning Store]      ▶ References (3)               │
└─────────────────────────────────────────────────────────────────────────┘
```

**Layout (expanded — reference list drops below the bar)**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🏪 my-store  [Open Planning Store]      ▾ References (3)               │
├─────────────────────────────────────────────────────────────────────────┤
│ store-a                                                    [Open]       │
│ store-b                                                    [Open]       │
│ store-c                                                    [Open]       │
└─────────────────────────────────────────────────────────────────────────┘
```

- Trigger: `Collapsible.Trigger` with `ChevronRight`/`ChevronDown` icon, right-aligned in bar
- Badge: `<Badge variant="secondary">{count}</Badge>` in trigger
- Content: Each reference shows label + `[Open]` button (no storeId, no path)
- Unavailable references: Show inline status indicator, not hidden

**Mobile**: Collapsed trigger wraps below pointer line when bar is too narrow. Expanded list items stack vertically.

### 3. Remove Description Copy

**Decision**: Remove descriptive text paragraphs (e.g., "This project points to planning store...", "N reference stores configured").

**Rationale**:
- Descriptions consume space without adding actionable value
- Inline status badges and count badges convey the same information
- Reduces visual noise

### 4. Unresolved/Unavailable: Direct Status Display

**Decision**: Show unresolved or unavailable stores with inline status indicators within the relationship navigation bar, not hidden or replaced with error messages.

**Rationale**:
- Users need to know which stores are configured even if unavailable
- Status indicators (e.g., `StatusIndicator` component) provide quick visual scan
- Avoids hiding configuration that may need attention

**Layout (pointer unavailable)**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🏪 my-store  ⚠️ unavailable  [Open Planning]      ▶ References (3)    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5. References: Ignore `remote` Field

**Decision**: For each reference entry `{ id, remote }` in the `references` array, only `id` is used for display, store resolution, and validation. The `remote` field is not read, displayed, or acted upon.

**Rationale**:
- Simplifies the data contract — the UI treats all references uniformly by `id`
- Store resolution via `resolveStoreRoot()` already works with `id` alone
- CLI discovery records (which may have their own remote/local distinction) are displayed as before; this decision does not alter their presentation
- Avoids coupling the Dashboard layout to the `remote` semantics that may evolve

### 6. Maintain Top Placement

**Decision**: Store Relationship section remains at Dashboard top, above Summary Cards.

**Rationale**:
- Store relationship is project-level context, not per-change
- Top placement ensures visibility without scrolling
- Compact layout eliminates the space pressure problem

## Risks & Trade-offs

| Risk | Mitigation |
|------|------------|
| Users may not discover references are collapsible | Count badge provides visual cue; expand animation draws attention |
| Pointer store label may be truncated on narrow screens | Use `truncate` class with `title` attribute for full label on hover |
| Removing path display reduces debug information | Path available in ProjectSelector overlay if needed |
| Collapsed state hides reference details | Single click to expand; count badge indicates volume |

## Alternatives Considered

### Alternative A: Drawer/Panel for References

**Rejected**: Adds navigation complexity; references are project-level context that should be visible without opening overlays. Collapsible preserves inline visibility.

### Alternative B: Separate Sections for Pointer and References

**Rejected**: Splits the relationship into two visual blocks; users must scan two areas to understand the full store relationship. Single bar conveys the complete picture at a glance.

### Alternative C: Tabbed Interface (Pointer | References)

**Rejected**: Over-engineering for two content types; tabs add cognitive load without proportional benefit.

## Migration Plan

No migration required. Changes are UI-only within `Dashboard.svelte` template section. Existing data flow, store resolution, and ProjectSelector behavior remain unchanged.

**Implementation scope**:
- Modify: `Dashboard.svelte` template section (L392-507)
- Preserve: All `$derived` computations, event handlers, store subscriptions
- Preserve: `FIXED_LABELS.dashboard.*` i18n keys (add new keys if needed)
- Preserve: `SurfaceCard`, `SectionHeader`, `Button`, `Badge`, `Collapsible` usage patterns

## Verification Criteria

1. Pointer store and references trigger coexist in a single relationship navigation bar at Dashboard top
2. References section collapsed by default with count badge in the bar
3. Clicking references trigger expands/collapses list below the bar
4. Unavailable stores show inline status indicator within the bar
5. Mobile/narrow: bar wraps when needed (pointer line + references trigger below)
6. No changes to store resolution, ProjectSelector, or data structures
7. Dashboard scroll depth reduced for typical configurations (3+ references)
8. `remote` field in reference entries is ignored; only `id` is used
