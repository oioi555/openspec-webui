## 1. Data Model and Parsing

- [x] 1.1 Extend the parsed change data model/API payload with Other File metadata and content for files directly under the change directory.
- [x] 1.2 Exclude standard artifacts (`proposal.md`, `design.md`, `tasks.md`, `specs/**/spec.md`) from Other Files.
- [x] 1.3 Ensure MCP review/approval folders outside the change directory are not included in Other Files.
- [x] 1.4 Compute a dashboard-visible other file count that excludes `.openspec.yaml`.

## 2. ChangeViewer UI

- [x] 2.1 Add an Other Files area to ChangeViewer that renders discovered files as collapsible file sections.
- [x] 2.2 Render Markdown Other Files with the existing Markdown renderer and search highlight behavior.
- [x] 2.3 Render JSON Other Files as pretty-printed readable content with raw fallback on parse failure.
- [x] 2.4 Render YAML/YML, TXT, and unknown text-like Other Files as preformatted text.

## 3. Dashboard and Explorer Indicators

- [x] 3.1 Add an `Other N` first-line badge to dashboard change cards when the `.openspec.yaml`-excluded count is greater than zero.
- [x] 3.2 Keep dashboard cards free of an Other badge when `.openspec.yaml` is the only Other File.
- [x] 3.3 Leave Explorer change rows unchanged with no Other badge or count.

## 4. Verification

- [x] 4.1 Add or update tests for change parsing/counting of `.openspec.yaml`, `revisions.json`, and standard artifact exclusions.
- [x] 4.2 Add or update UI tests for Other Files rendering and dashboard badge visibility.
- [x] 4.3 Run the relevant typecheck/test/build commands and fix any regressions.

## 5. Other Tab Correction

- [x] 5.1 Move Other Files rendering from appended in-page content into a dedicated top-level `Other` primary tab.
- [x] 5.2 Ensure Spec Deltas renders only spec delta content when active and Other Files render only when the `Other` tab is active.
- [x] 5.3 Update ChangeViewer tests to assert the `Other` tab exists and guards Other content from the Spec Deltas tab.
- [x] 5.4 Run focused validation for ChangeViewer and OpenSpec artifacts.

## 6. Revisions Rendering

- [x] 6.1 Render valid `revisions.json` Other Files as structured revision cards instead of generic pretty-printed JSON.
- [x] 6.2 Preserve generic JSON fallback when `revisions.json` does not match the expected revisions schema.
- [x] 6.3 Update focused ChangeViewer tests and validation for revisions rendering.
