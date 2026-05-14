## Why

OpenSpec MCP and custom workflows can create useful non-standard files inside a change directory, such as `.openspec.yaml`, `revisions.json`, or project notes. The WebUI should surface these files without turning MCP review/approval storage into first-class UI scope.

## What Changes

- Display non-standard files that live directly in an OpenSpec change directory in a dedicated `Other` primary tab in the Change detail view.
- Support readable rendering for Markdown, JSON, YAML/YML, text, and other text-like files with safe raw/preformatted fallback.
- Show an `Other N` badge in dashboard change cards only when there are non-standard files beyond the default `.openspec.yaml` noise file.
- Keep Explorer change rows unchanged; do not add Other indicators in the narrow Explorer list.
- Do not support MCP review/approval folders in this change because they are stored outside `openspec/changes/<changeId>/`.

## Capabilities

### New Capabilities
- `change-other-files`: Display and summarize non-standard files that belong to a change directory.

### Modified Capabilities
- `change-browsing`: Change detail views gain a top-level `Other` tab for non-standard files, separate from the Spec Deltas tab.

## Impact

- Affects change parsing/data model, API payloads, ChangeViewer rendering, dashboard active/recent change cards, and related tests.
- No new dependencies are expected unless existing parsing utilities cannot safely format YAML/JSON.
- No change to MCP review/approval storage, Explorer row layout, or core OpenSpec file semantics.
