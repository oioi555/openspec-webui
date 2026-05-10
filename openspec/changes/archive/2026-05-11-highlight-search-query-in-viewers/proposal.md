## Why

The Search panel already works well for screening candidate specs and changes, but after opening a result the operator still has to visually scan the markdown to find where the query matched. That slows down quick triage, especially for longer proposal/design/spec documents.

We want a simple in-page cue: highlight all visible matches of the current search query inside open markdown documents. The user explicitly does **not** want next/previous navigation, current-match state, or extra viewer UI. If the highlighting feels noisy, it should be easy to turn off from the Search panel and that preference should persist.

## What Changes

- add a Search panel header toggle using the `Highlighter` icon to enable or disable viewer query highlighting
- persist the toggle state locally and restore it in later sessions
- when enabled, highlight all exact literal matches of the current valid search query inside rendered markdown content in the Main Viewer
- apply the highlight to spec content, change documents, and change spec delta markdown using the shared warning/highlighter visual tone
- do not add next/previous controls, current-match UI, filename highlighting, or viewer-side highlight settings

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `explorer-pane`: the Search panel header exposes a persistent viewer-highlight toggle and keeps its status UI simple.
- `search`: the current valid query can drive optional in-page highlighting in open markdown viewers.
- `spec-browsing`: SpecViewer can render warning-tone highlights for matching query text inside spec markdown.
- `change-browsing`: ChangeViewer can render warning-tone highlights for matching query text inside proposal/design/tasks/spec delta markdown.

## Impact

- Affected frontend search state includes one persisted boolean preference for viewer highlighting.
- Affected Search panel UI includes the sticky header action area and removal of the now-redundant result-count badge.
- Affected viewer rendering includes the shared markdown rendering path used by `SpecViewer` and `ChangeViewer`.
- Regression coverage should verify persisted toggle state, markdown-only highlighting, and highlight clearing when the query becomes invalid or the toggle is disabled.
- No backend API, parser, or CLI contract changes are expected.
