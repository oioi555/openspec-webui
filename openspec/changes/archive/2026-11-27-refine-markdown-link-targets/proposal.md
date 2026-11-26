# Proposal

## Why

Real OpenSpec projects use link styles that the first version of Markdown link handling (`markdown-links`) does not handle well:

- AI coding tools write absolute `file://` links with a bare line or line-range fragment, such as `file:///…/jobs.py#849-851`. Only `#L<n>` and `:<n>` are recognized today, so the editor opens at line 1.
- Change documents link to evidence files kept in change subfolders, such as `evidence/pytest-full.txt`. These targets are inside the change directory, so they open the Change tab. The ChangeViewer does not show non-Markdown files in subfolders, so the link lands on the change without showing the file.
- Many local file links point at files that no longer exist (moved docs, deleted code). The WebUI cannot tell, so a click opens an editor on a missing path. Some editors then create an empty file.
- Archiving moves a change one directory deeper (`openspec/changes/<name>/` → `openspec/changes/archive/<date>-<name>/`). Relative links written before archiving that leave the change directory (for example `../../../docs/x.md`) then resolve one level too shallow.

## What Changes

- Line fragments `#<n>`, `#<n>-<m>`, `#L<n>-L<m>`, and `#L<n>-<m>` are recognized alongside `#L<n>` and `:<n>`. Ranges use their start line.
- A link inside a change directory opens the Change tab only when the ChangeViewer can show the target. That covers the change directory itself, root-level files, Markdown files in subfolders other than `specs/`, and delta specs. Every other file inside a change is handled as a local file through the "Open files with" preference.
- A new server endpoint reports whether local file link targets exist. It answers only for paths inside the active project's root or its OpenSpec root, reports other paths as unknown, and returns no file contents or metadata.
- Links whose target does not exist are marked as missing (struck through, with a "File not found" tooltip). Clicking one copies the path and shows a not-found warning instead of opening an editor.
- In archived change documents, a relative link whose target is neither a known spec or change nor an existing file is resolved again against the change's pre-archive location. The fallback is used only when it finds a known spec, change, or existing file.
- Existence results are cached in the browser and cleared on live refresh and project switch.

## Capabilities

### New Capabilities

### Modified Capabilities
- `markdown-links`: change-directory links that the ChangeViewer cannot show fall back to local-file handling (modified requirement). Added requirements cover more line-fragment forms, the existence check and its scope, missing-link behavior, and the archived-change fallback.

## Impact

- Server: a new `POST /api/path-status` route in `src/server/routes/api.ts`, scoped by the existing project context resolution.
- Frontend: `frontend/src/lib/markdownLinks.ts`, `markdown.ts`, `MarkdownRenderer.svelte`, a new browser-side existence cache, `api.ts`, and new messages in all locales.
- No new dependencies and no settings changes.
