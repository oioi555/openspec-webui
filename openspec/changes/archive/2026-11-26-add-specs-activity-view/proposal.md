# Proposal

## Why

OpenSpec lets a project organize capability specs in folders, such as `specs/network/auth/spec.md`, and identifies them by path ids like `network/auth`. The WebUI parser already discovers them, but the Explorer Pane's SPECS section lists every id as one flat row. In a project with around a hundred specs across several folders, long ids are hard to scan, and `Date` ordering scatters the specs of one folder across the list.

The SPECS section shares an accordion with Active Changes and Archive, so turning it into a tree there would leave even less vertical space. Making Specs a dedicated panel, like Search and Validation, gives the tree the full panel height.

## What Changes

- The Activity Bar Specs icon switches the Explorer Pane to a dedicated Specs panel, the same way the Search and Validate icons do.
- The Specs panel shows specs as a collapsible folder tree. A spec that also has children (for example `network` and `network/auth`) renders as one row.
- A folder row shows how many specs it contains and the most severe validation attention state among them.
- `Name` and `Date` ordering apply among siblings within each folder. A folder's date is the newest `lastModified` among its specs.
- Folder expansion is remembered per project. While the Specs panel is visible, the active spec tab's ancestor folders expand so its row is visible.
- **BREAKING (UI)**: The Explorer Pane's default accordion drops the SPECS section and keeps only Active Changes and Archive.
- Opening a spec tab does not switch Explorer Pane panels. Only the Specs icon and the Dashboard Specs summary card show the Specs panel.
- In a project whose specs are all top level, the tree looks like the existing one-level list.

Out of scope:
- Reordering specs by drag and drop, a filter input, and changes to the Search or Validation panels.
- Reorganizing this repository's own specs into folders.
- Server, API, or parser changes. Spec names already arrive as path ids.

## Capabilities

### New Capabilities
- `specs-panel`: The dedicated Specs panel opened from the Activity Bar, and its collapsible tree of nested specs (ordering, remembered expansion, revealing the active spec, and folder row summaries).

### Modified Capabilities
- `explorer-pane`: The default section group becomes Active Changes and Archive, and the Specs preset shows a dedicated panel.
- `activity-bar`: The Specs icon shows the Specs panel instead of focusing the SPECS section, and spec tabs no longer move the highlight to Specs.
- `spec-browsing`: The spec list moves into the Specs panel tree. The datetime and validation icon rules stay the same.

## Impact

- `frontend/src/lib/components/layout/ExplorerPane.svelte`, `ActivityBar.svelte`, and `activityBarController.ts`
- `frontend/src/lib/state/layout.svelte.ts` (presets, section state, and the sync rule for panels)
- `frontend/src/lib/components/shared/explorer-section/specs-explorer-section.svelte`, replaced by the Specs tree panel, and related tests
- `frontend/src/lib/views/Dashboard.svelte` (the `focusSection('specs')` call when opening a spec)
- `frontend/messages/*.json` for folder row labels and aria text
- No changes to the server, parser, or API types.
