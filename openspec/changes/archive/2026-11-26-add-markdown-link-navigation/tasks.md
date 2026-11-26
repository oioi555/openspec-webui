# Tasks

## 1. Link resolver

- [x] 1.1 Add a pure link resolver module (`frontend/src/lib/markdownLinks.ts`) that normalizes paths (POSIX and Windows, `.`/`..`, percent-decoding) and classifies an href as anchor, external, unsafe, spec, change (with file/delta/other-file target), or local file (with optional `#L<n>` / `:<n>` line). Verify with unit tests covering each scenario in `specs/markdown-links/spec.md`, including nested capabilities, archived changes, and the most-specific-match rule.
- [x] 1.2 Add editor URL building for each preset and for custom templates, including template validation (scheme required; `javascript`/`data`/`vbscript` rejected) and segment encoding. Verify with unit tests for each preset, a Windows path, a missing line (defaults to `1`), and invalid templates.

## 2. Rendering

- [x] 2.1 Extend `renderMarkdown()` to take an optional link context and use a dedicated `Marked` instance. Rewrite links per the resolver (route hrefs and `data-md-link` attributes for in-app targets, `target="_blank" rel="noopener noreferrer"` for external, no href for unsafe) and add GitHub-style `md-<slug>` heading ids with per-document duplicate suffixes. Verify with `markdown.test.ts` cases, including that `highlightSearchMatches()` and `highlightDeltas()` still produce the expected output.
- [x] 2.2 Add a `sourcePath` prop to `MarkdownRenderer.svelte`, read specs and changes from `appData`, and add one delegated click handler. Plain primary clicks navigate, scroll to anchors, or open/copy files. Modified and middle clicks fall through to the browser. Verify with a component test that a spec link calls `tabStore.open('/specs/<name>')` and that a fragment link scrolls only within its own renderer root.

## 3. Viewer integration

- [x] 3.1 Pass `sourcePath` from `SpecViewer` (`<spec.path>/spec.md`), `ChangeViewer` (core file `absolutePath`, `<change.path>/specs/<capability>/spec.md` for deltas, other file `absolutePath`), and `Dashboard` (config / legacy project doc paths). Verify with `npm run typecheck`.
- [x] 3.2 Generalize the ChangeViewer one-shot navigation viewer state (currently `searchNavigation`) so link navigation can select a core file, a delta capability, or an other file in the current or a newly opened change tab, without enabling search highlighting. Verify with tests for same-change and cross-change navigation, plus the existing `viewerSelectionSearch.test.ts`.

## 4. Open-files preference

- [x] 4.1 Add `openFilesWith` and `customEditorTemplate` to `uiPreferencesCore` with defaults (`copy`, empty) and load normalization. Verify with `uiPreferences.test.ts` for defaults, persistence, and invalid stored values.
- [x] 4.2 Add the "Open files with" control to Settings → General: a select with the presets, a custom template field with placeholder hint and invalid-template message, and the local-machine note. Add messages for all locales in `frontend/messages/*.json`. Verify with a settings test and `npm run typecheck`.
- [x] 4.3 Wire file-link clicks to the preference: copy mode uses `copyToClipboard()` with a success/failure toast, editor modes open the built URL, and an invalid custom template falls back to copy. Verify with a component test for copy and editor modes.

## 5. Integration check

- [x] 5.1 Run `npm test` and `npm run typecheck` and confirm both pass.
- [x] 5.2 Manually check in the running app with a sample project: relative spec/change/same-change links, a heading anchor, an external link, a source file link in copy mode, and in VS Code mode. If available, also check the Zed URL format and adjust the preset if needed (design Open Question).

## Workflow follow-up

- Ask before archiving. Archive and commit together after review.
