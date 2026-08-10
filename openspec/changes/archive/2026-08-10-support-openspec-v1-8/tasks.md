## 1. Server Store Discovery and Relationships (read-only)

- [x] 1.1 Add shared Store DTOs to `src/shared/types.ts` for store records (`id`, root path) and a tri-state discovery result (stores / empty / unavailable-with-reason)
- [x] 1.2 Add a server module that invokes only `openspec store list --json` and parses the documented JSON shape with defensive parsing
- [x] 1.3 Ensure the Store subprocess is read-only and never syncs, reads, or writes the CLI registry file or other registry state
- [x] 1.4 Record structured diagnostics when parsing fails or the CLI is missing/unsupported, without raising an unhandled error
- [x] 1.5 Add a read-only store-list route in `src/server/routes/api.ts` returning the tri-state discovery result
- [x] 1.6 Derive read-only relationship facts for the active project from its OpenSpec configuration: Store-root, `store:` pointer with `declared` root source, and `references:` count; never write planning data
- [x] 1.7 Add unit tests for store-list success, empty, malformed-output, CLI-missing, relationship derivation, and no-write guarantees

## 2. Frontend Store Data and API

- [x] 2.1 Add frontend Store and relationship types plus typed API access mirroring the shared DTO contract in `frontend/src/lib/api.ts` and `frontend/src/lib/types/api.ts`
- [x] 2.2 Create machine-global Store discovery state with stores, empty, and unavailable-reason states, independent of the active project
- [x] 2.3 Add relationship state resolving Store-root, pointer, and references facts for the active project
- [x] 2.4 Add stale-response protection so older discovery results cannot overwrite newer ones
- [x] 2.5 Add tests for Store state success, empty, unavailable, project change, stale-response, and relationship resolution behavior

## 3. Unified Project Selector List

- [x] 3.1 Build the selector's unified list as the UNION of existing WebUI projects and CLI-registered Stores, as one flat navigable list with no `Registered Stores` region, section, heading, second list, Store-only sidebar, or `Open Store` action
- [x] 3.2 Merge sources by canonical normalized root path into exactly one row per root; a shared root renders one row with a `Store` badge and store id
- [x] 3.3 Ensure Store-only roots appear by default in the unified list and are selectable/openable through the same normal selection/activation/binding flow as any project row, with no second manual add-project step
- [x] 3.4 Render hierarchy-free relationship badges on rows: `Store`, `Points to: <id>` for `store:` pointers, and `References: N` for references
- [x] 3.5 Keep Store discovery failures non-blocking: when discovery is unavailable, WebUI project rows still render and Store rows are simply absent
- [x] 3.6 Add tests for Store-only default visibility and selection, merged duplicate-root rows, distinct-root rows, badge rendering, and absence of a separate Store region/action

## 4. Selector Header Store Documentation Links

- [x] 4.1 Add centralized current official Store constants to `frontend/src/lib/openspecDocs.ts`: Store guide `https://github.com/Fission-AI/OpenSpec/blob/main/docs/stores-beta/user-guide.md` and Store CLI reference `https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#stores-standalone-openspec-repos`, leaving existing generic constants unchanged
- [x] 4.2 Render both links as visible external documentation links in the Project Selector HEADER near the list context, with suggested labels `OpenSpec Stores Guide` and `Store CLI Reference` (localized equivalents)
- [x] 4.3 Keep the header links visible in success, empty, and unavailable Store discovery states, with discovery errors non-blocking
- [x] 4.4 Ensure the WebUI does not reproduce or summarize Store setup, registration, removal, or lifecycle instructions — official docs are authoritative
- [x] 4.5 Add tests for exact rendered links, label rendering, and visibility across all three discovery states

## 5. Conditional Dashboard Relationship Card

- [x] 5.1 Show a compact `OpenSpec Store` badge in the Dashboard header when the active project is a Store root; render the Store relationship card only when a `store:` pointer or `references:` is declared
- [x] 5.2 For `store:` pointer projects, prominently identify the planning Store and provide a direct `Open planning Store` action that activates the matching Store row/root in the unified selector list; never suggest initializing local specs
- [x] 5.3 For `references:` projects, keep the current project's own planning root and show the references as read-only context, with registered referenced Stores navigable
- [x] 5.4 Render a non-blocking unavailable relationship with the official docs link when a declared Store cannot be resolved from CLI registration; never fabricate a local planning root
- [x] 5.5 Ensure no card renders for projects with no Store relationship, and no card renders for pure Store roots without pointer or references
- [x] 5.6 Add tests for pointer routing to the planning Store, references preserving the local root, registered referenced Store navigation, unresolved non-blocking states, badge-only for pure Store root, and no-card-on-unrelated-projects

## 6. Recursive Spec Discovery and Rendering

- [x] 6.1 Update the parser to discover capability specs recursively over `openspec/specs/**/spec.md` at any depth in addition to top-level `specs/<capability>/spec.md`
- [x] 6.2 Skip directories that contain only nested directories and no direct `spec.md` so empty parent directories are not rendered as capabilities
- [x] 6.3 Tolerate deleted retired spec files by omitting them from discovery without errors
- [x] 6.4 Ensure sorting, validation icons, and rendering behavior for discovered specs are unchanged
- [x] 6.5 Add tests for nested spec discovery, empty-parent skipping, deleted-file tolerance, and unchanged validation behavior

## 7. Recursive Spec Search

- [x] 7.1 Extend search over spec markdown to include nested `openspec/specs/**/spec.md` files at any depth
- [x] 7.2 Ensure nested spec results use the same `spec` result semantics, name/metadata matching, deduplication, and tab-opening behavior as top-level specs
- [x] 7.3 Add tests for nested spec body matches, nested spec name/path metadata matches, and deduplication

## 8. Command Preferences and Shortcuts (v1.8 workflow)

- [x] 8.1 Add `update` as a Core Commands preference in `frontend/src/lib/state/commandPreferencesCore.ts` and ensure it is excluded from the Expanded Commands group
- [x] 8.2 Exclude `onboard` from both the Core and Expanded command preference groups
- [x] 8.3 Add the workspace `update` command chip in `frontend/src/lib/commandShortcuts.ts` alongside `propose`/`explore`, gated on visibility preference, and ensure `onboard` is never rendered or generated in any command chip surface
- [x] 8.4 Add tests for the `update` preference, `update` chip generation, and `onboard` exclusion across preferences, chips, generated commands, and availability responses

## 9. Acceptance and Verification

- [x] 9.1 Acceptance: a Store-only CLI registration appears by default in the unified selector list and is selectable/activatable like any project row without a second manual add-project step
- [x] 9.2 Acceptance: WebUI project and registered Store sharing a canonical normalized root collapse to exactly one row with a `Store` badge; no duplicate rows and no separate Store region/list/heading or `Open Store` action
- [x] 9.3 Acceptance: rows show only official badges (`Store`, `Points to: <id>`, `References: N`) and never master/slave, parent/child, owner, or hierarchy terminology
- [x] 9.4 Acceptance: the selector header renders both exact current official links (`.../blob/main/docs/stores-beta/user-guide.md` and `.../blob/main/docs/cli.md#stores-standalone-openspec-repos`) in success, empty, and unavailable discovery states, and the WebUI does not summarize Store lifecycle instructions
- [x] 9.5 Acceptance: the Dashboard card for a `store:` pointer project identifies the planning Store and its `Open planning Store` action activates the matching Store row/root; local spec initialization is never suggested
- [x] 9.6 Acceptance: for `references:` projects the Dashboard preserves the current project's own planning root and shows read-only references; registered referenced Stores are navigable
- [x] 9.7 Acceptance: an unresolved pointer/reference Store shows a non-blocking unavailable relationship with the official docs link and never fabricates a local planning root
- [x] 9.8 Acceptance: the Explorer Pane retains only its ACTIVE CHANGES / ARCHIVE / SPECS sections with no Store catalog
- [x] 9.9 Run frontend and server unit tests for Store discovery, relationships, selector, dashboard card, recursive specs, search, and command changes
- [x] 9.10 Run `npm test`
- [x] 9.11 Run `npm run typecheck`
- [x] 9.12 Run `openspec validate "support-openspec-v1-8" --strict`
- [x] 9.13 Manually verify: Store-only row appears and selects, duplicate roots merge to one Store-badged row, header links visible in all discovery states, pointer project routes to its planning Store, references keep the local root, unresolved cases stay non-blocking, nested spec browse/search, `update` chip when enabled, `onboard` absent everywhere, and missing-CLI Store discovery degrading without breaking browsing
