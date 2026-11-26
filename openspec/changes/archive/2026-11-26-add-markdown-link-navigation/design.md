# Design

## Context

`renderMarkdown()` in `frontend/src/lib/markdown.ts` passes `marked` output straight to `{@html}` in `MarkdownRenderer.svelte`. Links keep their raw `href`, so the browser resolves relative links against the SPA route. `marked` does not add heading ids.

The frontend already has everything needed to resolve links without server changes:

- `SpecSummary.path` / `Spec.path`: absolute capability directory (the spec file is `<path>/spec.md`).
- `ChangeSummary.path` / `Change.path`: absolute change directory, active and archived.
- `ChangeFile.absolutePath`, `OtherFile.absolutePath`: absolute paths of the files inside a change. A delta spec lives at `<change.path>/specs/<capability>/spec.md`.
- `appData` holds the spec list and the active/archived change lists.
- `ChangeViewer` already accepts a one-shot `searchNavigation.matchLocation` through `tabStore` viewer state. It selects a file group or file, a delta capability, or an other file. Link navigation can reuse that mechanism.
- `copyToClipboard()` in `utils.ts` and `svelte-sonner` toasts already exist.

The WebUI is local-first and binds to `127.0.0.1` by default, so the browser and the files are normally on the same machine.

## Goals / Non-Goals

**Goals:**
- One pure, unit-testable resolver that maps `(href, source document path, known specs/changes)` to a link kind and a target.
- Keep native link affordances (middle-click, copy link address) for in-app targets.
- Open editors without any server-side process execution.

**Non-Goals:**
- Scrolling to an anchor inside a *different* document (`spec.md#heading`). The target document opens, but at the top.
- An in-app viewer for non-OpenSpec files (source code).
- Launching editors from the server (`code <path>` via `child_process`). This is the "approach B" alternative. It is recorded below for a possible follow-up.
- An "Open in editor" entry in item context menus. It can reuse the same preference later.

## Decisions

### 1. Resolve at render time, intercept clicks in the renderer

`MarkdownRenderer` gets a `sourcePath` prop (the absolute path of the rendered document) and reads the spec and change lists from `appData`. During rendering, a link renderer rewrites each `<a>`:

- in-app targets → `href` = WebUI route (`/specs/<name>`, `/changes/<name>`), plus `data-md-link` attributes that carry the kind and target (file selection).
- fragment → `href="#slug"`, `data-md-link="anchor"`.
- external → original href, `target="_blank" rel="noopener noreferrer"`.
- local file → `href` = the editor URL when an editor is selected, or `#` for copy mode, plus `data-md-link="file"` with the absolute path and line.
- unsafe/unknown scheme → rendered without `href` (plain text styling of a link).

One delegated `click` handler on the renderer root handles plain primary clicks on `data-md-link` anchors: in-app → `tabStore.open()` plus viewer state; anchor → scroll; file → copy or open the editor URL. Modified clicks (Ctrl/Cmd/Shift/middle) fall through to the browser, so in-app links still open as real routes in a new browser tab.

*Alternative:* resolve only at click time and leave raw hrefs. Rejected: middle-click and "copy link address" would still give broken URLs.

The renderer uses a dedicated `Marked` instance per render context instead of mutating the global `marked` options, so callers without `sourcePath` (for example tests) keep today's output except for heading ids and external link targets.

### 2. Path resolution in the browser

A small POSIX-style normalizer handles `.`/`..`, percent-decoding, and stripping of `?query`. Windows paths from the server (`C:\…`) are normalized to forward slashes before matching and before building editor URLs (`vscode://file/C:/…`). Matching uses exact path equality or a directory-prefix check (`target === dir || target.startsWith(dir + '/')`). Resolution order:

1. Fragment-only → anchor.
2. Scheme present → external (`http`, `https`, `mailto`) or unsafe.
3. Resolve to an absolute path → spec (`<spec.path>/spec.md` or `<spec.path>`) → change (inside `<change.path>`; the most specific match wins, so nested archive paths are not confused) → local file.

Line numbers come from a `#L<n>` fragment (GitHub style) or a trailing `:<n>` on the path.

### 3. Selecting the file inside a change

The resolver returns a `matchLocation`-compatible target: a core file group/file name, a delta capability, or an other-file path. For a different change, navigation writes it into the target tab's viewer state with a fresh `requestKey` before `tabStore.open()`. For the same change, the click handler applies it to the current tab through the same viewer-state path. The existing `searchNavigation` effect then selects and expands it. The field is generalized (or aliased) so the name does not imply search. Search highlighting stays tied to the search query, not to the navigation.

### 4. Heading ids

The heading renderer adds `id="md-<slug>"`. The slug is GitHub-style: lower-case, punctuation removed, spaces → `-`, duplicates suffixed `-1`, `-2` per document. The `md-` prefix avoids collisions with app element ids. The anchor handler looks up `md-<fragment>` inside the clicked renderer root only, because a ChangeViewer can show several delta specs with the same headings. `highlightSearchMatches()` only touches text segments, so ids survive highlighting.

### 5. Editor preference via URL schemes ("approach A")

The preference is added to `uiPreferencesCore` (`openFilesWith: 'copy' | 'vscode' | 'cursor' | 'windsurf' | 'vscodium' | 'antigravity' | 'zed' | 'custom'`, `customEditorTemplate: string`). It is normalized on load like the existing fields. Presets:

| Option | URL |
|---|---|
| VS Code | `vscode://file/{path}:{line}` |
| Cursor | `cursor://file/{path}:{line}` |
| Windsurf | `windsurf://file/{path}:{line}` |
| VSCodium | `vscodium://file/{path}:{line}` |
| Antigravity IDE | `antigravity-ide://file/{path}:{line}` |
| Zed | `zed://file/{path}:{line}` |

Antigravity IDE registers `antigravity-ide` as its URL protocol (`product.json` `urlProtocol`), not `antigravity`, so the preset uses that scheme.

For presets, `{path}` is the absolute path with each segment percent-encoded and `/` kept. For custom templates it is fully URL-encoded. `{line}` defaults to `1`. A custom template must start with an alphabetic scheme followed by `:` and must not use `javascript`, `data`, or `vbscript`. An invalid template falls back to copy behavior and is flagged in Settings.

*Alternative (approach B):* a server endpoint that spawns the editor CLI. It works for any CLI editor, but it adds a local command-execution surface that needs path allow-listing. Deferred.

## Risks / Trade-offs

- [The browser runs on another machine than the server, for example with `--host 0.0.0.0`] → editor URLs point at server paths and do not work. Copy path stays the default, and the Settings text says that the editor must be on the browser's machine.
- [An editor's URL handler is not registered, or the scheme format differs (Zed, JetBrains)] → nothing visible happens on click. Verify the presets manually during implementation. JetBrains is reachable through the custom template.
- [Links to targets that do not exist (deleted spec, typo)] → they resolve as local files and fall back to copy or editor. This is acceptable and visible to the user.
- [Render-time resolution depends on the spec/change lists] → the rendered HTML is derived from them, so live refresh re-resolves links automatically.
- [`marked` renderer API changes across major versions] → keep the renderer overrides small and covered by `markdown.test.ts`.

