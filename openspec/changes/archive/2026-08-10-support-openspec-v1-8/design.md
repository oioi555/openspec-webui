## Context

OpenSpec CLI 1.8.0 (installed locally, `openspec --version` → 1.8.0) adds Stores (`openspec store list --json` returns `{ stores: [{ id, root }], status: [] }`) and allows nested spec trees. The WebUI currently discovers only `specs/<capability>/spec.md`, has no Store awareness, and its command surfaces predate the v1.8 core workflow. See proposal.md — Why.

Revisions `rev-e6d46d30` through `rev-2c9103ea` (recorded) converge on the final model: Stores are machine-global, ordinary OpenSpec project roots. There is no Store catalog sidebar in the Explorer and no separate Store region in the selector. Instead the Project Selector is ONE flat unified navigable list (WebUI projects UNION CLI-registered Stores), merged by canonical normalized root path into one row per root. Store-only roots appear by default and use the normal selection/activation flow. Store documentation links live in the selector HEADER as current official `main` links, and the WebUI does not reproduce Store lifecycle instructions. The Dashboard relationship card routes `store:` pointer projects to their planning Store and preserves the local planning root for `references:` projects.

Existing relevant behavior: `ProjectSelector.svelte` renders the WebUI project list and the Add Project control; `src/server/routes/api.ts` runs CLI subprocesses (validation, version status) with defensive output handling; `src/server/openspec-config.ts` already exposes `update` as a core workflow and blocks `onboard`; `frontend/src/lib/openspecDocs.ts` centralizes docs URL constants; `frontend/src/lib/views/Dashboard.svelte` is the Home surface.

## Goals / Non-Goals

**Goals:**
- Read-only Store discovery (`openspec store list --json` only) with structured, defensively parsed results and tri-state availability (stores / empty / unavailable-with-reason), feeding a unified selector list.
- One flat unified Project Selector list (WebUI projects UNION registered Stores) merged by canonical normalized root path into one row per root, with Store-only rows visible and selectable by default.
- Hierarchy-free relationship badges (`Store`, `Points to: <id>`, `References: N`) on unified rows.
- Dashboard relationship card that routes pointer projects to their planning Store and preserves the local planning root for references projects, with non-blocking unavailable states.
- Current official Store documentation links (`main`, living) in the Project Selector header, visible in success/empty/unavailable states.
- v1.8 spec compatibility: recursive `specs/**/spec.md` discovery, rendering, and search; empty parent dirs skipped; deleted retired spec files tolerated; validation behavior unchanged.
- `update` supported as a v1.8 core workspace command; `onboard` excluded from every command surface.

**Non-Goals:**
- No `Registered Stores` region, section, heading, second list, Store-only sidebar, or `Open Store` action.
- No requirement for a second manual WebUI registration before opening a Store; no filtering of Store-only roots.
- No Store lifecycle in the WebUI: `store setup`/`register`/`unregister`/`remove`, worksets, Git/remote ops, `--store` execution, or a Store doctor UI/API.
- No reproduction or summary of Store concepts, setup, registration, removal, or lifecycle instructions in the WebUI — official docs are authoritative.
- No direct sync/read/write of the CLI registry file or other registry state.
- No local planning data (changes, specs, project data) created for `store:` pointers or `references:`; no fabricated local planning root for unresolved Stores.
- No hierarchy terminology: no master/slave, parent/child, owner, or ownership implications.
- No `onboard` in any command preference, shortcut, or generated command surface.
- No changes to validation behavior or to the package/release surface.

## Decisions

**D1: Store discovery invokes only `openspec store list --json` and is read-only.**
The server runs `openspec store list --json` and parses only the documented shape. The result is one of the sources for the unified Project Selector list and is used to resolve Store relationships for Dashboard routing. Alternatives considered: parsing the CLI registry file directly — rejected because it couples the WebUI to v1.8's internal on-disk format and the CLI explicitly manages that state.

**D2: The Project Selector is one unified list (WebUI projects UNION registered Stores).**
A registered Store is an ordinary OpenSpec project root intentionally registered by the user, so Store-only roots appear by default and are selectable/openable through the same normal selection/activation/binding behavior as any project row. No second manual add-project step is required. Internal persistence (whether/how the server records Store-backed sessions) is an implementation detail; only observable behavior is specified.

**D3: Sources merge by canonical normalized root path into one row.**
Both WebUI project paths and CLI-reported Store roots are normalized canonically (resolve symlinks, case, and trailing separators) before comparison. Shared roots collapse to exactly one row enriched with a `Store` badge and store id; distinct roots render as distinct rows. Root matching is a source merge, never a filter: Store-only rows are not hidden and no row is removed because of registration state.

**D4: Relationships are expressed without hierarchy using official concepts.**
The relationship model is: a Store is a standalone planning repo; a `store:` project is a pointer / externalized planning whose resolved root source is `declared`; `references:` are read-only context. UI badges use only `Store`, `Points to: <id>` (pointer/planning-destination), and `References: N`. A blocked vocabulary (master/slave, parent/child, owner, hierarchy) is enforced in copy. Relationship facts are derived read-only; nothing is written.

**D5: The Dashboard uses a badge for Store-root identity and a card for pointer/reference actions.**
A pure Store root is passive metadata — the Dashboard shows a compact `OpenSpec Store` badge beside the project name in the header, not a full relationship card. The card is reserved for actionable relationships: for an active `store:` pointer project whose local OpenSpec may be config-only or empty, the card prominently identifies the planning Store and provides a direct action (for example `Open planning Store`) that activates the matching Store row/root in the unified list; it never suggests initializing local specs. For `references:`, the card keeps the current project's own planning root and shows references as read-only context, with registered referenced Stores navigable. Unresolved declared Stores render a non-blocking unavailable relationship with the official docs link and never fabricate a local planning root. A Store root that also has references gets both the header badge (identification) and the card (actionable reference rows).

**D6: Store documentation links live in the Project Selector header as current official links.**
The header (near the list context, not a footer guide) renders visible links via centralized constants pointing to the official current `main` pages — Store guide `https://github.com/Fission-AI/OpenSpec/blob/main/docs/stores-beta/user-guide.md` and Store CLI reference `https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#stores-standalone-openspec-repos` — with suggested labels `OpenSpec Stores Guide` and `Store CLI Reference`. These are deliberately living links, not version-pinned tags; other v1.8 compatibility behavior may remain version-scoped. The WebUI does not summarize Store concepts or lifecycle instructions.

**D7: Docs constants are centralized.**
`openspecDocs.ts` gains current official Store guide and Store CLI reference constants used by the selector header. Existing generic constants (install, setup, opsx, workflows, commands, supported-tools) remain as-is so non-version-specific links stay coherent.

**D8: Store lifecycle is terminal-only.**
No lifecycle actions exist in the WebUI; Store surfaces point to terminal guidance and the official docs. This matches the approved model that lifecycle work happens where output is visible.

**D9: Store discovery is tri-state and non-blocking.**
Discovery returns stores | empty | unavailable(reason). Unavailable renders non-blocking guidance, the selector header links stay visible, and project browsing is unaffected when the CLI is missing, unsupported, or the list fails.

**D10: v1.8 command workflow.**
`update` is added to the workspace command set as a v1.8 core command (enabled via visibility preferences, same as `propose`/`explore`). `onboard` is filtered at the server availability boundary (`/api/commands/availability`, already partially implemented in `openspec-config.ts`) and again at every client render/generation point (defense in depth).

## Risks / Trade-offs

- [CLI `store list --json` shape changes in a future version] → Mitigation: defensive parsing with structured diagnostics; failure degrades to unavailable, never to an app error (D1, D9).
- [Canonical path normalization mismatches (bind mounts, case-insensitive filesystems)] → Mitigation: normalize on both sides (resolve symlinks, case, trailing separators); a mismatched Store simply renders as its own row rather than crashing (D3).
- [Pointer project with config-only local OpenSpec is confused for a broken project] → Mitigation: the Dashboard card prominently identifies the planning Store and routes via `Open planning Store`; local spec initialization is never suggested (D5).
- [Declared Store is not registered with the CLI] → Mitigation: non-blocking unavailable relationship with the official docs link; no fabricated planning root (D5, D9).
- [Badge vocabulary drifts into hierarchy terms] → Mitigation: restricted official vocabulary (`Store`, `Points to: <id>`, `References: N`) enforced in copy and tests (D4).
- [Upstream CLI reports `onboard` as available] → Mitigation: filter at the server availability boundary plus client render/generation filters (D10).
- [Nested spec paths collide with legacy flat names] → Mitigation: capability identity is the containing directory; discovery and validation behavior for existing top-level specs is unchanged.
- [Living `main` docs links drift out of sync with a specific CLI version] → Mitigation: Store is beta and official docs are authoritative; the WebUI deliberately links to current pages and does not duplicate their content (D6, D7).

## Migration Plan

Backwards compatible and additive. Existing flat `specs/<capability>/spec.md` projects continue to work because recursive discovery includes the top level. The Explorer Pane is untouched (three-section invariant preserved). The Project Selector's unified list is a superset of the previous project list (registered Stores add rows), the header gains docs links, and the Dashboard gains a conditional card; none of these require registry or data migration, and Store discovery never mutates the project registry. Rollback: removing Store sourcing/merging, the header links, and the Dashboard card, and reverting the recursive-walk/command changes, restores prior behavior; no new dependencies are introduced.
