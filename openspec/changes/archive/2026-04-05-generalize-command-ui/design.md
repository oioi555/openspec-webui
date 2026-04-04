## Context

The current repo exposes one hardcoded command-copy surface in `frontend/src/components/ChangeViewer.svelte`: a floating button that copies `/openspec:apply <change> task <label>`. The navigation bar currently uses its right side only for search, there is no settings store, and the only browser-persisted UI state is the suggestion store in localStorage. The requested change generalizes command syntax away from a single Claude-oriented path, adds workflow-aware settings, and spreads command shortcuts across Dashboard, Changes, and ChangeViewer.

The OpenSpec CLI can report workflow availability through `openspec config get workflows`, but the UI must degrade safely when that inspection fails or returns nothing usable. This repo is still local-first, so configuration should remain browser-local rather than being written into the workspace.

## Goals / Non-Goals

**Goals:**
- Let operators switch command syntax between `default` (`/opsx-*`) and `Claude Code` (`/opsx:*`).
- Persist AI tool and expanded-command visibility preferences in localStorage.
- Add a settings launcher on the right edge of the primary navigation and show the preferences in a modal dialog.
- Gate expanded command toggles and buttons by the workflows reported from the local OpenSpec CLI.
- Add workspace-scoped and change-scoped copy command buttons that match the requested placement and argument rules.
- Remove the old task-number floating apply bubble.

**Non-Goals:**
- Writing back to OpenSpec CLI configuration or mutating repository files from the settings modal.
- Implementing language or theme settings in this change.
- Reworking suggestion-mode flows beyond any layout adjustments required to coexist with the new command surfaces.
- Adding support for OpenSpec commands outside the requested set (`propose`, `explore`, `apply`, `archive`, `new`, `continue`, `ff`, `verify`, `sync`, `bulk-archive`).

## Decisions

### 1. Introduce a dedicated command-preferences store

Add a new client-side store for command preferences with two concerns:
- `aiTool`: `default` or `claude-code`
- `expandedVisibility`: independent booleans for `new`, `continue`, `ff`, `verify`, `sync`, and `bulk-archive`

The store will persist to localStorage, mirroring the existing suggestion-store pattern. This keeps the feature browser-local and avoids coupling UI preferences to repository state.

### 2. Inspect workflow availability through a read-only backend API

Expose a backend endpoint that shells out to the local OpenSpec CLI and returns workflow availability plus an inspection status. The UI will use that response to decide which expanded toggles are enabled and which expanded command buttons can be rendered.

Alternatives considered:
- Running `openspec config get workflows` directly from the browser: impossible in the current web architecture.
- Hardcoding the expanded command list as always available: rejected because the user explicitly wants availability to follow the local OpenSpec setup.

### 3. Treat core and expanded commands differently

Core commands (`propose`, `explore`, `apply`, `archive`) are always available and have no show/hide toggles. Expanded commands (`new`, `continue`, `ff`, `verify`, `sync`, `bulk-archive`) are shown only when both conditions hold:
- the CLI inspection reports the workflow as available
- the operator leaves that command enabled in settings

This keeps the command surfaces predictable while still letting operators suppress individual expanded shortcuts.

### 4. Centralize command text generation

Introduce a helper that converts a workflow ID plus optional `changeName` into a copyable command string:
- `default` → `/opsx-<workflow>`
- `claude-code` → `/opsx:<workflow>`
- workspace surfaces append no positional arguments
- change surfaces append `<change-name>` only

This removes duplicated string construction and guarantees that Dashboard, Changes, and ChangeViewer stay in sync.

### 5. Replace the floating apply bubble with header/action-row command surfaces

The current floating bubble is too narrow for the requested command set and bakes in task-label arguments. The replacement will render grouped copy buttons in the normal view layout:
- Dashboard and Changes: workspace-scoped commands
- ChangeViewer: change-scoped commands

This makes command availability legible and avoids one-off task-label behavior.

### 6. Build a reusable modal shell for settings

The repo currently has feature-specific overlays (`SuggestionPanel` modal and `SuggestionPopover`). This change should add a reusable modal/dialog shell for settings rather than another one-off overlay so future settings growth has a consistent base.

## Risks / Trade-offs

- **CLI inspection can fail or be slow** → Cache the last successful availability result in memory for the page session and disable expanded settings/buttons gracefully when inspection is unavailable.
- **Browser-local preferences do not sync across browsers** → Accept this trade-off because repo-shared configuration is out of scope and localStorage matches the current local-first UX.
- **More command buttons can crowd headers** → Group commands by context and keep the set state-driven so only relevant actions render.
- **OpenSpec docs may evolve** → Keep command generation based on workflow IDs and AI tool syntax instead of hardcoding product copy beyond the requested formats.

## Migration Plan

1. Add backend workflow-availability inspection and the frontend command-preferences store.
2. Add the reusable settings modal and navigation launcher.
3. Replace the legacy floating apply bubble with the new Dashboard, Changes, and ChangeViewer command surfaces.
4. Validate clipboard output for both syntax modes and confirm expanded commands hide when unavailable.

## Open Questions

- Should ChangeViewer keep showing command buttons while suggestion mode is active, or should suggestion mode temporarily suppress them to reduce UI noise?
- Should the settings modal show unavailable expanded commands as disabled rows or hide them entirely once workflow availability is known?
