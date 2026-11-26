# Design

## Context

See proposal.md for motivation. Link resolution lives in the pure module `frontend/src/lib/markdownLinks.ts` and runs inside a `$derived` render in `MarkdownRenderer.svelte`. The browser does not know whether a local path exists. The server already resolves the active project per request (`resolveProjectContext()` in `src/server/routes/api.ts`) and exposes `projectRoot` and `openspecPath`. For a store-backed project, `openspecPath` is inside the store, so the store root is `dirname(openspecPath)`.

Live refresh (`data:refresh` over the websocket) only covers files under the OpenSpec root.

## Goals / Non-Goals

**Goals:**
- Tell existing, missing, and unknown link targets apart without exposing file contents.
- Keep the resolver pure and testable. Existence data is passed in, not fetched by it.
- Fix links that archiving broke, without breaking links that were already rewritten for the archived location.

**Non-Goals:**
- Checking targets outside the project root and the OpenSpec root.
- Watching files outside the OpenSpec root for existence changes.
- Rewriting the Markdown on disk.

## Decisions

### 1. Dedicated `POST /api/path-status` endpoint

Request `{ paths: string[] }`, response `{ statuses: Record<string, boolean | null> }`. The handler logic lives in a small server module (`src/server/path-status.ts`) that takes the allowed roots and a stat function, so it can be unit-tested without Fastify:

- Reject more than 200 paths, or a non-array body, with 400.
- For each path: `path.resolve()` it, then accept it only if `path.relative(root, resolved)` neither starts with `..` nor is absolute for at least one allowed root (project root, OpenSpec store root). This also handles Windows drive and case differences. Rejected paths get `null` without touching the filesystem.
- Accepted paths get `true`/`false` from `fs.stat` (any error → `false`). No size, mtime, or type is returned.

POST keeps long path lists out of URLs and logs. *Alternative:* return existence from the change/spec APIs during parsing. Rejected because link targets are only known after Markdown rendering, and Dashboard documents would need their own path too.

Symlinks inside the project are followed by `stat`. At most this reveals whether a symlink target exists, for links the project owner created. That is acceptable for a local-first tool bound to `127.0.0.1` by default.

### 2. Browser-side existence cache

A rune store (`frontend/src/lib/state/pathStatus.svelte.ts`) keeps `Record<path, boolean | null>`, plus a pending set. The batching and chunking logic sits in a pure core (`pathStatusCore.ts`) for unit tests:

- `get(path)` returns `true | false | null | undefined` (`undefined` = not loaded yet). It is a reactive read, so rendered HTML re-derives when results arrive.
- `request(paths)` queues paths that are neither loaded nor pending and flushes once per microtask, in chunks of 200.
- `clear()` runs on every `data:refresh` message and in `clearLoadedWorkspaceState()` (project switch).

Svelte forbids state writes inside `$derived`. Rendering therefore only collects unknown paths into a plain `Set` passed through render options, and an `$effect` in `MarkdownRenderer` hands that set to `request()`.

### 3. Resolver extensions

`MarkdownLinkContext` gains an optional `pathStatus(path) => boolean | null | undefined`. The resolver:

1. Resolves as today.
2. If the result is a `file`, it reads the status, sets `missing: true` only when the status is `false`, and reports `undefined` statuses through an optional `onUnknownPath` callback.
3. Archived fallback runs only for relative hrefs in a source document matching `…/changes/archive/YYYY-MM-DD-<name>/…`, and only when step 1 gave a `file` whose status is `false`. It re-resolves the href against the same relative location under `…/changes/<name>/`. It uses the second result if it is a `spec` or `change`, or a `file` with status `true`. Otherwise the first result stays, marked missing. While either status is unknown, the first result is rendered unmarked and both paths are requested.

The first target wins whenever it exists. That keeps links already written for the archived location (`../../../../docs/x.md`) intact.

### 4. Missing link rendering and clicks

Missing file links render with the class `md-link-missing`, `data-md-missing="true"`, a localized "File not found" title, and a `file://` href (never the editor URL, so middle-click cannot open an editor either). The click handler passes the missing flag to `openFile`. `MarkdownRenderer` then writes the path to the clipboard and shows a warning toast instead of building an editor URL. `.md-link-missing` (line-through, muted) and the existing `.md-link-disabled` get styles in `app.css`.

## Risks / Trade-offs

- [Files outside the OpenSpec root change while the page is open] → statuses go stale until the next live refresh, project switch, or reload. This is documented here and acceptable, because these targets rarely change during a session.
- [Many links on one page] → one request per render pass, chunked at 200, and cached across viewers.
- [A first render shows links unmarked before statuses arrive] → a brief flash. Acceptable, because the request is local.
- [Fallback picks the wrong target] → it only applies when the first target is missing and the second one exists or is a known spec or change. Both are strong signals.
- [Older server without the endpoint] → the client treats request failures as `null` (unknown), so links behave as before.
