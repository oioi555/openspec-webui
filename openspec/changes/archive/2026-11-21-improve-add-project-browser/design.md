# Design

## Context

`/api/fs/browse` returns all non-hidden subdirectories with a `hasOpenSpec` flag, sorted by name, in 1–7 ms even for `/tmp` (931 entries). `AddProjectDialog.svelte` renders each entry as a `<button>` with two or three Lucide icons inside a `max-h-100` scroll box, so every navigation re-renders the whole list.

## Goals / Non-Goals

**Goals:** keep each navigation step light regardless of folder size, and make finding a project folder take a few keystrokes.

**Non-Goals:** server-side paging or search, recursive project discovery, showing hidden folders.

## Decisions

- **Client-side derivation.** A `$derived` list applies, in order: OpenSpec-first stable sort, then a case-insensitive `includes` filter on `name`, then a `slice(0, limit)`. The API stays unchanged, because the server is not the bottleneck and the full list is already in memory.
  - Alternative: add `?q=` and `?limit=` to the API. Rejected, because it adds round trips per keystroke for no measured gain.
- **Limit of 200 with "show all".** One button reveals every remaining match instead of paging in steps. Once a filter is typed, the match set is usually small anyway.
  - Alternative: virtual scrolling. Rejected, because it adds a dependency and complexity for a dialog list.
- **Reset on navigation.** `loadBrowse()` clears the filter and limit before the request, so a stale filter never hides the new folder's entries.
- **Filter input placement.** It sits directly above the list, and focus stays in the path bar on open. Enter in the filter opens the single match when exactly one entry matches.

## Risks / Trade-offs

- [The filter hides the folder the operator expects] → An empty-match state shows the filter text and a clear button, distinct from "No subdirectories found".
