## Context

The dashboard (`Dashboard.svelte`) is the home surface of OpenSpec WebUI. Its header currently shows an `<h1>` title and a FolderPen button on the right. The existing Versions feature (Settings → Versions page) already fetches version snapshots from the server and stores them in `versionStatusStore`. The explorer section component (`explorer-section.svelte`) has `scrollIntoView` logic, but only in the direct-toggle handler—not when `focusedSection` changes programmatically.

## Goals / Non-Goals

**Goals:**
- Give users at-a-glance version status visibility from the dashboard without navigating to Settings
- Make explorer section focus always visually confirmed by scrolling the section header into view
- Both behaviors should reuse existing infrastructure (version store, layout store, `headerRef`)

**Non-Goals:**
- Replacing or duplicating the Settings → Versions page functionality
- Auto-update or background refresh of version data beyond what already exists
- Changing how the activity bar or dashboard cards trigger focus (only adding scroll response)

## Decisions

### 1. Version badge reads from existing `versionStatusStore`

The badge consumes `versionStatusStore.snapshot` directly. No new API calls or store logic needed. The store already fetches on app load and the existing toast notification proves the data pipeline works.

### 2. Badge is a `Badge` component from shadcn-svelte with conditional variant

- **No updates**: `variant="outline"`, shows app version string quietly
- **Updates available**: `variant="warning"` (or `destructive`), shows "current → latest" with arrow icon, clickable

Rationale: shadcn `Badge` already used elsewhere; keeps visual consistency.

### 3. Badge click opens Settings modal directly to Versions page

Call `openSettings('versions')` (or equivalent modal navigation). This avoids implementing a separate version detail UI.

### 4. Scroll-into-view via reactive `$effect` on `focusedSection` in `explorer-section.svelte`

Add an `$effect` that watches the `focusedSection` state from `layoutStore`. When it matches this section's `section` prop and the section is expanded, call `headerRef?.scrollIntoView({ behavior: 'smooth', block: 'start' })`.

Rationale: The existing `scrollIntoView` in `handleToggle()` only fires on user-initiated toggles. A reactive effect catches both `focusSection()` calls (dashboard card clicks) and `setActivityPreset()` calls (activity bar + dashboard summary cards) since both set `focusedSection` in the layout store.

### 5. Use `requestAnimationFrame` wrapper for scroll

Same pattern as existing `handleToggle()`. Ensures the DOM has updated (section expanded) before scrolling.

## Risks / Trade-offs

- **Badge updates only on snapshot refresh**: If version data is stale, the badge may show outdated info. → Acceptable: same limitation as Settings → Versions page. The store already refreshes on app load.
- **Scroll may fire redundantly**: If the focused section is already visible, `scrollIntoView` is a no-op or minimal scroll. → Acceptable: no visual disruption.
- **Scroll timing with drawer open animation**: In narrow mode, the drawer may still be animating when scroll fires. → Mitigate with a small `setTimeout` delay after `requestAnimationFrame`, or use `onTransitionEnd` if needed.
