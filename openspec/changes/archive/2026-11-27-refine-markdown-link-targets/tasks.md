# Tasks

## 1. Link resolution

- [x] 1.1 Extend line-fragment parsing in `frontend/src/lib/markdownLinks.ts` to accept `#<n>`, `#<n>-<m>`, `#L<n>-<m>`, and `#L<n>-L<m>` (start line wins). Verify with `markdownLinks.test.ts` cases for each form, including a `file://` link with `#849-851`.
- [x] 1.2 Classify change-directory targets: keep `change` only for the change directory, root-level files, Markdown files in non-`specs/` subfolders, and `specs/<capability>/spec.md` or capability directories under `specs/`. Return `file` (with the line) for any other target. Verify with `markdownLinks.test.ts` cases for `evidence/pytest-full.txt`, `evidence/report.json`, `notes/a.md`, `revisions.json`, and `specs/auth/spec.md`, plus a `markdown.test.ts` case that an evidence link renders as `data-md-link="file"`.

## 2. Path existence API

- [x] 2.1 Add `POST /api/path-status` in `src/server/routes/api.ts`: accept `{ paths: string[] }` (max 200, else 400), normalize each path, answer `true`/`false` only for paths inside the project root or the OpenSpec store root and `null` otherwise, and return no other file data. Verify with `src/server/path-status.test.ts` unit cases and a `server.integration.test.ts` route case for an existing file, a missing file, an outside path, a `..` escape, the 201-path limit, and an invalid body.
- [x] 2.2 Add a client wrapper in `frontend/src/lib/api.ts` and a browser-side existence cache that batches unknown paths into one request per render pass and clears on live refresh and project switch. Verify with unit tests for batching, caching, and clearing.

## 3. Missing links and archived-change fallback

- [x] 3.1 Extend the link resolver with an optional existence lookup: mark `file` targets as missing when the lookup says `false`, and for documents inside `changes/archive/<date>-<name>/` retry relative links against `changes/<name>/` when the first target is neither a known spec or change nor an existing file, keeping the retry only if it finds one. Verify with `markdownLinks.test.ts` cases for the three archived-change scenarios and for missing, existing, and unknown targets.
- [x] 3.2 Render missing file links with a missing marker class and a "File not found" tooltip, and make clicks on them copy the path with a warning toast instead of opening an editor. Add messages for all locales. Verify with `markdown.test.ts`, `markdownLinkActions.test.ts`, and the `MarkdownRenderer` SSR test.

## 4. Integration check

- [x] 4.1 Run `npm test` and `npm run typecheck` and confirm both pass, then check missing links and archived-change fallback links against a sample project in the running app.

## Workflow follow-up

- Ask before archiving. Archive and commit together after review.
