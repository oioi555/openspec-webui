# Change: Capture Baseline Specs

## Why

This repository now uses OpenSpec, but it does not yet have a recorded baseline for the behavior that already exists in the codebase. Before planning larger product changes, we need current-state specs so future changes can diff against a stable contract and keep a history of how that contract was established.

## What Changes

- Add an OpenSpec baseline for the existing OpenSpec WebUI behavior.
- Capture the current CLI, project context, spec browsing, change browsing, task tracking, live refresh, search, and suggestion handoff behavior as new capabilities.
- Add `openspec/project.md` during implementation so the repository has project context alongside the new baseline specs.
- Validate the baseline artifacts and archive the completed change so the history of the reverse-engineering step remains in `openspec/changes/archive/`.

## Capabilities

### New Capabilities
- `cli-runtime`: Launching the local server, validating target paths, opening the browser, and serving the SPA shell.
- `project-context`: Exposing project identity, dashboard metrics, primary navigation context, and project documentation.
- `spec-browsing`: Listing capabilities and rendering spec/design documents.
- `change-browsing`: Listing active and archived changes and rendering grouped change artifacts, spec deltas, and HTML previews.
- `task-tracking`: Parsing markdown checklists, aggregating task progress, and surfacing the next apply command.
- `live-refresh`: Watching OpenSpec files and refreshing the UI through websocket-driven updates.
- `search`: Searching supported OpenSpec content from the global navigation.
- `suggestion-handoff`: Capturing review suggestions in the browser and generating clipboard-ready implementation instructions.

### Modified Capabilities
- None.

## Impact

- Affected code: no runtime behavior changes are planned; this change captures the current implementation as specification.
- Affected OpenSpec artifacts: `openspec/project.md`, new baseline specs under `openspec/specs/*`, and the archived baseline capture change.
- Validation: `openspec validate` for the change and resulting main specs.
