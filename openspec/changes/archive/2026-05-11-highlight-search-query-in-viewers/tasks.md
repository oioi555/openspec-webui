## 1. Search highlight preference

- [x] **1.1** Add a persisted boolean preference for Search-driven viewer highlighting in frontend state.
- [x] **1.2** Add the `Highlighter` toggle to the Search panel sticky header, using warning-tone styling when enabled.
- [x] **1.3** Remove the redundant Search result-count badge while keeping result status readable in the header.
- [x] **1.4** Verify the toggle restores its previous state after reload/reopen.

## 2. Shared markdown highlight behavior

- [x] **2.1** Add a shared markdown highlight step that applies literal query matches across rendered markdown body content only.
- [x] **2.2** Ensure highlight behavior composes with existing markdown post-processing such as change-delta styling.
- [x] **2.3** Clear or skip highlights when the query is shorter than Search's minimum length or the toggle is disabled.
- [x] **2.4** Add regression coverage for literal-match highlighting, case-insensitive matching, and metadata-only results producing no in-page highlight.

## 3. Viewer integration

- [x] **3.1** Wire SpecViewer markdown rendering to the Search query + persisted highlight toggle.
- [x] **3.2** Wire ChangeViewer markdown rendering, including proposal/design/tasks/spec delta documents, to the same behavior.
- [x] **3.3** Verify the viewer surfaces do not add next/previous controls, current-match UI, or extra settings chrome.

## 4. Verification

- [x] **4.1** Run targeted frontend tests for Search header toggle behavior and viewer highlighting.
- [x] **4.2** Run `npm test`.
- [x] **4.3** Run `npm run typecheck`.
- [x] **4.4** Run `openspec validate highlight-search-query-in-viewers --strict`.
