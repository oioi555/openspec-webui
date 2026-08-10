## Why

OpenSpec CLI v1.8.0 introduces Stores (standalone planning repos registered on the machine) and allows specs to live in nested trees, but the WebUI is pinned to pre-v1.8 assumptions: it only discovers top-level `specs/<capability>/spec.md`, has no awareness of registered Stores, and its command surfaces predate the v1.8 core workflow. Without this change, v1.8 workspaces and Store-backed repos cannot be recognized, browsed, or opened from the WebUI, and Store relationships cannot be understood.

## What Changes

- Add read-only Store discovery by invoking only `openspec store list --json`; never sync, read, or write the CLI registry directly. The Project Selector becomes one flat, unified, navigable list whose sources are the UNION of existing WebUI projects and CLI-registered Stores. A registered Store is an ordinary OpenSpec project root and appears by default, even when it was not separately added to the WebUI project registry.
- Merge sources by canonical normalized root path into exactly one row. When a WebUI project and a registered Store share a root, one row renders with a `Store` badge and store id. No `Registered Stores` region, section, heading, second list, Store-only sidebar, or separate `Open Store` action is created. Selecting a Store row uses the same normal selection/activation/binding behavior as any project row and requires no second manual add-project step.
- Express Store relationships without hierarchy using only official concepts: a `store:` project is a pointer / externalized planning whose resolved root source is `declared`, and `references:` are read-only context. Rows are enriched with concise badges (`Store`, `Points to: <id>`, `References: N`) and never master/slave, parent/child, owner, or ownership-implication terminology.
- Add a conditional Dashboard relationship card only when the active project declares a `store:` pointer or declares `references:`. For a Store root project, a compact `OpenSpec Store` badge beside the project name in the Dashboard header provides passive identification; the full card is reserved for actionable pointer or reference relationships. For a `store:` pointer project whose local OpenSpec may be config-only or empty, the card prominently identifies its planning Store and provides a direct action that activates the matching Store row/root in the unified list; it never suggests initializing local specs. For `references:`, the card keeps the current project's own planning root and shows the references as read-only context, with registered referenced Stores navigable. Unresolved declared Stores show a non-blocking unavailable relationship with the official documentation link and never fabricate a local planning root.
- Show visible official Store documentation links in the Project Selector HEADER (near the list context), using centralized constants pointing to the official current `main` pages — Store guide `https://github.com/Fission-AI/OpenSpec/blob/main/docs/stores-beta/user-guide.md` and Store CLI reference `https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#stores-standalone-openspec-repos` (suggested labels `OpenSpec Stores Guide` / `Store CLI Reference`). The WebUI SHALL NOT reproduce or summarize Store setup, registration, removal, or lifecycle instructions; Stores are beta and official docs are authoritative. The links remain visible whether discovery succeeds, is empty, or is unavailable, and discovery errors are non-blocking.
- Keep Store lifecycle terminal-only: no `store setup` / `register` / `unregister` / `remove`, no workset management, no Git/remote operations, no `--store` execution path, and no Store doctor UI/API; provide concise guidance that lifecycle work happens in the terminal where output is visible.
- Add v1.8 spec compatibility: recursively discover, render, and search nested `openspec/specs/**/spec.md`; do not render empty parent directories as capabilities; tolerate deleted retired spec files; preserve normal validation behavior.
- Add `update` to command preferences and shortcut surfaces according to the v1.8 core workflow. `onboard` is intentionally excluded from every command preference, shortcut, and generated command surface, even if the upstream CLI reports it available.
- Degrade gracefully: a missing or unsupported CLI, or a Store-list failure, must never break existing project browsing; Store discovery becomes unavailable with non-blocking guidance rather than failing the app.

## Capabilities

### New Capabilities
- `store-discovery`: Read-only Store discovery via `openspec store list --json` feeding the unified Project Selector list and Dashboard relationship routing, read-only pointer/reference surfacing with non-blocking unresolved states, current official Store documentation links, and graceful degradation when the CLI is unavailable.
- `store-relationships`: Official Store relationship model (Store roots, `store:` pointers with `declared` root sources, and read-only `references:`) and the conditional Dashboard relationship card that routes pointer projects to their planning Store, preserves the local planning root for references projects, and never fabricates local planning content.

### Modified Capabilities
- `project-selector-ui`: Render one flat unified navigable list (WebUI projects UNION registered Stores), merge sources by canonical normalized root path into one Store-badged row, show Store-only rows by default with normal selection/activation, render hierarchy-free relationship badges, and show current official Store documentation links in the selector header.
- `spec-browsing`: Recursively discover and render nested `openspec/specs/**/spec.md` capabilities, skip empty parent directories, and tolerate deleted retired spec files.
- `search`: Recursively search nested spec markdown under `openspec/specs/**/spec.md`.
- `command-preferences`: Add `update` as a v1.8 core command preference and exclude `onboard` from the Commands settings.
- `command-shortcuts`: Add the workspace `update` command chip per the v1.8 core workflow and exclude `onboard` from every command chip and generated command surface.

## Impact

- `src/server/routes/api.ts` — Read-only store-list route invoking `openspec store list --json`, with defensive parsing and structured diagnostics; command availability extended with `update` and hardened against `onboard`.
- New/extended server relationship resolution — Derive Store-root, `store:` pointer, and `references:` relationship facts from the active project's OpenSpec configuration without writing planning data.
- `src/shared/types.ts` and `frontend/src/lib/types/api.ts` — Store DTOs, relationship DTOs, and unavailable-state diagnostics.
- `src/parser/` — Recursive spec discovery over `specs/**/spec.md`, skipping empty parent directories and deleted retired files.
- `frontend/src/lib/components/layout/ProjectSelector.svelte` — Unified list sourcing WebUI projects and registered Stores, canonical-path merging into one row per root, Store/pointer/reference badges, normal selection/activation for Store rows, and header Store documentation links.
- `frontend/src/lib/views/Dashboard.svelte` — Compact `OpenSpec Store` badge in the header for Store-root identity; conditional Store relationship card that routes pointer projects to their planning Store and preserves the local planning root for references projects.
- `frontend/src/lib/openspecDocs.ts` — Centralized current official Store guide and Store CLI reference URL constants; existing generic docs constants remain coherent.
- `frontend/src/lib/commandShortcuts.ts` and `frontend/src/lib/state/commandPreferencesCore.ts` — `update` workspace command and `onboard` exclusion.
- The Explorer Pane keeps its existing project-scoped ACTIVE CHANGES / ARCHIVE / SPECS sections; no Store catalog is added there.
- No changes to package files, existing main specs beyond the declared deltas, or unrelated modules.
