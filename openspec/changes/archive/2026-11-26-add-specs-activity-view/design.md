# Design

## Context

- The Explorer Pane switches on `layoutStore.activityPreset`. `search` and `validate` show dedicated panels (`SearchExplorerSection`, `ValidationExplorerSection`). `home`, `archive`, and `specs` show the three-section accordion, and `specs` only expands the SPECS section (`ExplorerPane.svelte`, `state/layout.svelte.ts`).
- `ActivityBar.svelte` derives a preset from the active tab path with `activitySectionFromPath()` and applies it with `syncActivityPreset()`. A `/specs/...` path yields `specs`. Syncing is skipped while `search` or `validate` is shown.
- `specs-explorer-section.svelte` renders specs as a flat list. Spec names arrive from the server as path ids such as `network/auth`, so the server and parser need no changes.
- The Dashboard Specs summary card calls `setActivityPreset('specs')`, and `openSpec()` on the Dashboard calls `focusSection('specs')`.

## Goals / Non-Goals

**Goals:**
- Build, sort, and summarize the tree with pure functions that do not depend on Svelte, so they can be unit tested.
- Put the `specs` preset on the same dedicated-panel path as `search` and `validate`.

**Non-Goals:**
- Row virtualization. A few hundred rows render fine; revisit if projects reach thousands of specs.
- Changing how spec names appear in the Search and Validation panels (they keep full path ids).
- Changing tab titles or tab tooltips.

## Decisions

### 1. Build the tree on the client from spec ids
A new `$lib/specTree.ts` provides `buildSpecTree()`, which splits each `SpecSummary.name` on `/` into nodes (`segment`, `path`, optional `spec`, `children`). The same module holds sibling ordering (folders first by name; newest descendant date for `Date`), spec counts, and the most-severe validation summary, all as pure functions.
- Alternative: have the server return a tree. That needs API type changes and would make the panel treat ids differently from Search and Validation. The id strings are enough, so this was rejected.

### 2. Make the `specs` preset a dedicated panel
`ExplorerPane.svelte` gains an `activityPreset === 'specs'` branch that renders a new `SpecsTreePanel` (`explorer-section/specs-tree-panel.svelte`). The default accordion drops the SPECS section. The `specs` member of the `ExplorerSection` type stays as a panel identifier, but it is no longer a `focusedSection` or scroll target. A stored `sectionCollapsed.specs` value is simply ignored.
- Alternative: a tree inside the accordion. Rejected for lack of vertical space, as agreed with the maintainer.

### 3. Do not switch panels automatically
`syncActivityPreset()` leaves the preset alone while `specs`, `search`, or `validate` is shown. While the default group is shown, a spec tab becoming active does not switch to `specs`: `activitySectionFromPath()` no longer maps `/specs/` paths to `specs`. The Dashboard `openSpec()` drops its `focusSection('specs')` call.
- Rationale: replacing the accordion with the Specs panel every time a spec opens would get in the way of change-focused work. This matches editors that do not switch side views to follow the active editor.
- Alternative: switch to the Specs panel when a spec tab opens. Rejected for the reason above.

### 4. Store folder expansion per project in localStorage
The key is `openspec-specs-tree`, and the value is `{ [projectId]: string[] }`, the expanded folder paths. Every folder starts collapsed. Paths that no longer exist are ignored when rendering and pruned when saving. Ancestors expanded by revealing the active spec are saved too.
- Alternative: keep state for the session only. With around a hundred specs, re-expanding folders on every visit is tedious, so this was rejected.

### 5. Reuse `ExplorerSectionItem` for spec rows and add only indentation and a chevron
Spec rows keep the existing click, preview tab, context menu, datetime, and validation icon behavior. They pass the full id as `name` and the last segment as `displayName`. Plain folder rows use a small separate row component (chevron, segment, count, summary icon). A row that is both a spec and a folder puts a chevron button at its start, and the rest of the row behaves as a spec row.
- Indentation is 12px per level. Three levels add 36px, so names stay readable at the 180px minimum pane width.

### 6. Follow the WAI-ARIA tree pattern for keyboard support
The container gets `role="tree"`, each row `role="treeitem"` and `aria-level`, and folders `aria-expanded`. Focus uses a roving tabindex. Up, Down, Left, Right, and Enter are handled against the flattened list of visible rows.

## Risks / Trade-offs

- [Without the SPECS section, the spec list is not visible next to changes] → Change pages link to their specs through deltas, and the Specs panel is one click away.
- [Ids containing `/` in URLs] → Tab URLs keep using `encodeURIComponent(name)`, unchanged.
- [Folder validation summaries recompute over every descendant] → Compute them once in a `$derived` value from the spec list and validation state, which is cheap at this scale.
- [Existing tests assume the SPECS section exists] → Replace them with Specs panel tests (listed in tasks).

## Migration Plan

Frontend only. A stored `sectionCollapsed.specs` value is ignored, so no migration step is needed. To roll back, revert this change's commit.
