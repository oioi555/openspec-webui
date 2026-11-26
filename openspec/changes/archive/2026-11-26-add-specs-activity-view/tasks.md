# Tasks

## 1. Tree logic

- [x] 1.1 Add `buildSpecTree()` to `frontend/src/lib/specTree.ts`. It splits spec ids on `/` into folder and spec nodes and merges a spec that also has children into one node. Verify in `specTree.test.ts` with flat ids, three nested levels, a spec that has children, and a top-level spec next to folders.
- [x] 1.2 Add sibling ordering: `Name` lists folders first, then specs, each alphabetically; `Date` lists newest first by the newest descendant `lastModified`. Verify the `Name order lists folders first` and `Date order keeps categories together` scenarios in tests.
- [x] 1.3 Add folder spec counts (all descendants) and the most-severe validation summary (`failed` > `warning` > `info`, otherwise none). Verify the `Folder row shows its spec count` and `Folder row surfaces a failing descendant` scenarios in tests.
- [x] 1.4 Add visible-row flattening (rows and levels from the expansion state) and the ancestor paths of the active spec. Verify both in tests.

## 2. Expansion state

- [x] 2.1 Add a store that saves and loads expanded folders per project under `openspec-specs-tree`, ignores missing paths, and prunes them on save. Verify in Core unit tests that broken JSON and a missing localStorage fall back to all collapsed.

## 3. Specs panel

- [x] 3.1 Create `explorer-section/specs-tree-panel.svelte` with a fixed header (title, count, `Name` / `Date` sort defaulting to `Name`), the `No specs found` empty state, and a scroll area that fills the panel.
- [x] 3.2 Render spec rows with `ExplorerSectionItem`, passing the full id as `name` and the last segment as `displayName`, indented 12px per level. Implement plain folder rows (chevron, segment, count, summary icon) and the chevron button on rows that are both a spec and a folder. Verify in tests that the tooltip shows the full id and that Search Related Changes receives the full id.
- [x] 3.3 While the panel is visible, expand the active spec tab's ancestors, mark its row active, and scroll it into view without collapsing other folders.
- [x] 3.4 Add `role="tree"`, `treeitem`, `aria-level`, `aria-expanded`, and a roving tabindex, and handle Up, Down, Left, Right, and Enter. Extract the key handling into a pure function and verify it in tests.
- [x] 3.5 Add the new strings (folder row aria labels, count text) to all seven `frontend/messages/*.json` files and confirm the paraglide compile passes in `npm run typecheck`.

## 4. Explorer Pane and Activity Bar wiring

- [x] 4.1 In `ExplorerPane.svelte`, render the Specs panel when `activityPreset === 'specs'`, and remove the SPECS section and `specsSortMode` from the default accordion. Delete `specs-explorer-section.svelte` and update the `index.ts` exports.
- [x] 4.2 Make `syncActivityPreset()` in `layout.svelte.ts` skip syncing while `specs` is shown, and stop `activitySectionFromPath()` from mapping `/specs/` paths to `specs`. Update `activityBarController.test.ts` to cover `Spec tab does not move the highlight`.
- [x] 4.3 Remove `focusSection('specs')` from `openSpec()` in `Dashboard.svelte`, and confirm that the Specs summary card's `setActivityPreset('specs')` opens the Specs panel.
- [x] 4.4 Update existing tests that assume the SPECS section (such as `validationPanel.test.ts`) for the Specs panel, and confirm `npm test` passes.

## 5. Verification

- [x] 5.1 Confirm `npm run typecheck`, `npm test`, and `npm run build` all pass.
- [x] 5.2 Check in a browser with a local fixture project of about a hundred nested specs. Use `playwright-core` installed outside the repository, `/usr/bin/chromium`, and `npm run dev -- --port <p>`. Check that:
  - top-level folders and a top-level spec render side by side;
  - a three-level folder expands;
  - `Date` ordering keeps each folder's specs together;
  - expansion survives a reload;
  - switching to the Specs panel with a spec tab active reveals that spec;
  - rows stay readable at the 180px minimum width;
  - the default group shows only Active Changes and Archive.
- [x] 5.3 Confirm in a browser that this repository's flat specs render as a one-level list with no folder rows.

## Workflow follow-up

- After implementation and verification, ask the maintainer before archiving. Archive and commit together.
