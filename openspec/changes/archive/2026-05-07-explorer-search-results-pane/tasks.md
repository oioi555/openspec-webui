## 1. Search State and Routing

- [x] 1.1 Locate current search dialog/state, result selection, Activity Bar, context menu, and `Spec.md` keyword search integration points.
- [x] 1.2 Introduce or refactor shared frontend search state so all entry points can set a query, request focus, track loading/results, clear state, and ignore stale responses.
- [x] 1.3 Update result selection to open or focus Main Viewer tabs without clearing the current query or results.

## 2. Explorer Search Panel UI

- [x] 2.1 Add a standalone Search panel to the Explorer Pane with a fixed header, localized explanatory text, input, result count/status, short-query guidance, empty state, and clear control.
- [x] 2.2 Render search results as Explorer-style selectable list items showing type, name, and excerpt.
- [x] 2.3 Ensure initiating search expands the Explorer Pane if needed, switches to the Search panel, and focuses the input.

## 3. Entry Point Integration

- [x] 3.1 Route Activity Bar Search icon behavior to the Explorer Search section instead of the dialog-only workflow.
- [x] 3.2 Route item context menu search actions to populate and focus the Explorer Search section.
- [x] 3.3 Route `Spec.md` keyword search affordances to populate and focus the Explorer Search section.
- [x] 3.4 Remove or retire obsolete dialog-specific result display paths where they conflict with the persistent Explorer section.

## 4. Verification

- [x] 4.1 Verify valid queries debounce and render results, short queries clear results, and stale responses are ignored.
- [x] 4.2 Verify selecting multiple search results keeps the list visible while switching Main Viewer tabs.
- [x] 4.3 Run relevant typecheck/build/test commands and fix regressions.
