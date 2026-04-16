## Context

The layout store (`frontend/src/stores/layout.svelte.ts`) defines three responsive modes — `narrow`, `medium`, `wide` — with breakpoints at 768px and 1024px. In practice, only `narrow` vs. non-narrow is ever checked by components (`AppLayout.svelte`, `ActivityBar.svelte`). The `medium` tier has zero behavioral impact.

The application is desktop-only, and the primary use case is snapping the browser to half of a FHD (1920×1080) screen — 960px. The current 768px breakpoint was inherited from mobile-first conventions that don't apply here.

## Goals / Non-Goals

**Goals:**
- Align the narrow-mode breakpoint with FHD half-width (960px) so Explorer becomes a drawer exactly at the half-screen snap boundary
- Remove the unused `medium` responsive mode to simplify the type and reduce dead code
- Keep the change minimal — only the store and specs are affected

**Non-Goals:**
- Making the breakpoint user-configurable (fixed value is appropriate for desktop-only)
- Adding new responsive behaviors or intermediate breakpoints
- Changing any visual styling or component structure

## Decisions

### 1. Fixed 960px breakpoint (not configurable)

**Choice**: Hard-code the breakpoint at 960px and treat widths at or below it as narrow.

**Rationale**: The application is desktop-only. FHD is the standard desktop resolution. Half-FHD (960px) is the most common snap width. Non-FHD displays below 960px half-width are rare in 2026 and would benefit from drawer mode anyway (the document viewer needs room). VSCode and similar desktop tools use fixed breakpoints without user configuration.

**Alternatives considered**:
- User-configurable breakpoint: adds settings UI complexity and testing matrix for negligible gain
- Content-based threshold (528px = min viable 3-pane): too permissive, defeats the purpose of giving the viewer room

### 2. Collapse ResponsiveMode to binary

**Choice**: Change `ResponsiveMode` from `'narrow' | 'medium' | 'wide'` to `'narrow' | 'wide'`.

**Rationale**: No component checks for `medium`. The only behavioral distinction is narrow (drawer) vs. wide (persistent panel). Removing `medium` eliminates dead state and simplifies `getResponsiveMode`.

### 3. Use named constant for breakpoint value

**Choice**: Extract `960` into a named constant `DESKTOP_BREAKPOINT` in the layout store and compare with `<=` so `960px` itself is included in narrow mode.

**Rationale**: Magic numbers in conditions are harder to maintain. A named constant makes the intent clear and provides a single place to adjust if the decision ever changes.

## Risks / Trade-offs

- **[Users with sub-FHD displays at half-screen]** → Below 960px, Explorer becomes a drawer. This is the intended behavior — the document viewer gets full width. Users on HD (1366×768) or HD+ (1600×900) who snap to half will get drawer mode, which is appropriate given the limited space.
- **[No migration needed]** → This is a threshold change with no persisted state impact. `responsiveMode` is computed at runtime from viewport width.
