# Proposal

## Why

Links inside rendered Markdown (proposal, design, tasks, delta specs, main specs, other change files) mostly do not open. Relative links such as `./design.md` or `../../specs/auth/spec.md` are resolved by the browser against the SPA route (`/changes/<name>`), so they land on a non-existent change. Heading anchors do not scroll because rendered headings have no ids. External URLs replace the WebUI in the same browser tab and drop the open tabs. Links to source files outside `openspec/` have no viewer in the WebUI at all.

## What Changes

- Relative links that point to a known spec or change open inside the WebUI. Spec targets open the Spec tab. Change targets open the Change tab and select the linked file when it is part of that change.
- Links to another file of the same change switch the ChangeViewer to that file without leaving the tab.
- Same-document heading anchors (`#some-heading`) scroll the viewer to the matching heading. Rendered headings get stable slug ids.
- External `http(s)` and `mailto` links open in a new browser tab.
- Links to other local files (for example source code outside `openspec/`) use a configurable "Open files with" preference. Choices: copy the absolute path (default), VS Code, Cursor, Windsurf, VSCodium, Antigravity IDE, Zed, or a custom URL template with `{path}` and `{line}` placeholders. Editors are opened through their URL schemes from the browser. The server does not launch any process.
- Settings → General gets the "Open files with" preference. It is stored in the browser like the other UI preferences.

## Capabilities

### New Capabilities
- `markdown-links`: how links inside rendered Markdown content are resolved and opened (in-app navigation, anchors, external URLs, local files through the editor preference).

### Modified Capabilities
- `settings-view`: the General section adds the "Open files with" editor preference.

## Impact

- Frontend only: `frontend/src/lib/markdown.ts`, `MarkdownRenderer.svelte`, its callers (`SpecViewer`, `ChangeViewer`, `Dashboard`), `ChangeViewer` file selection (reuse of the existing viewer-state navigation), `uiPreferences` state, `SettingsView`, and messages in all locales.
- No API or server changes. The existing absolute paths (`Spec.path`, `Change.path`, `ChangeFile.absolutePath`, `OtherFile.absolutePath`) are enough to resolve links.
- No new dependencies.
