## 1. Phase 1 - Availability and change-scoping bug fixes

- [x] 1.1 Remove `update` from the workspace command row: remove it from `getWorkspaceCommands` and workspace chip rendering in `ExplorerPane.svelte` / `Dashboard.svelte` / Home drawer
- [x] 1.2 Remove `continue` and `ff` from the workspace command row: remove the incomplete-change workspace shortcut logic from `getWorkspaceCommands` and workspace chip rendering; `continue`/`ff` render only on change-scoped surfaces
- [x] 1.3 Add `update` to change-scoped commands for active, unarchived changes in BOTH incomplete and complete task states, with a distinct label `Revise Plan` (distinct from the CLI `openspec update`)
- [x] 1.4 Append the known change name to copied change-only commands (`apply`, `continue`, `ff`, `update`, `verify`, `sync`, `archive`) wherever they render on a Change surface
- [x] 1.5 Define change-scoped chip ordering including `update`: incomplete `apply`, `update`, `continue`, `ff`, `sync`; completed `verify`, `update`, `sync`, `archive`; update existing ordering tests
- [x] 1.6 Gate every command surface on the CLI-reported `workflows` list as the single source of truth (replace core/expanded hardcoded availability gating for display decisions); `availableExpandedCommands` no longer used client-side for display
- [x] 1.7 Keep `sync` gated on spec-delta presence and on CLI `workflows` membership, unchanged in both task states
- [x] 1.8 Add tests: CLI workflows gate (command absent from `workflows` never renders), update/continue/ff workspace exclusion (never rendered at workspace scope even when incomplete changes exist), update shown in both task states with change name, Revise Plan label distinct from CLI `openspec update`, change-only commands append the known change name

## 2. Phase 2 - Server detection and API additions

- [x] 2.1 Create a server-side detection module that scans the active project root for OpenSpec-generated artifacts (tool roots with `skills/openspec-*/SKILL.md` non-empty dirs and `opsx-*` command files, folder-namespaced `opsx/<id>` and filename `opsx-<id>` shapes, `.amazonq/prompts`, `.kimi-code`, `.codex`/`.agents` special cases)
- [x] 2.2 Ensure empty directories are never reported as detections; a tool root with no command files and no `SKILL.md` yields nothing
- [x] 2.3 Map each detected root to tool name, delivery (Commands / Skills / both), an example invocation for a representative workflow, and the source path; derive the invocation form from the file shape per the six official forms
- [x] 2.4 Extend `GET /api/commands/availability` additively with `delivery` (from `openspec config get delivery`, defensively parsed), `integrations` (detected tools), `forms` (deduplicated distinct invocation-form candidates), and `toolOptions` (supported tool-name choices derived from the server signature catalog); keep existing fields, mark `availableExpandedCommands` deprecated
- [x] 2.5 Keep `onboard` filtering at the server availability boundary unchanged
- [x] 2.6 Update shared `CommandAvailability` types (server + `frontend/src/lib/types/api.ts`) and the frontend `getCommandAvailability` client
- [x] 2.7 Add tests: single/multiple/zero detection, empty-dir non-detection, same-string dedupe across tools, defensive parsing when CLI output is malformed, onboard defense

## 3. Phase 3 - Frontend invocation model

- [x] 3.1 Create a centralized workflow-metadata module (id, user label, `scope: workspace | change`, skill name) covering every surfaced workflow; scopes per the confirmed surface criterion: workspace-only `propose`, `explore`, `new`, `bulk-archive`; change-only `apply`, `continue`, `ff`, `update`, `verify`, `sync`, `archive`; `update` → scope `change`, skill `openspec-update-change`; no `onboard` entry; no `multi-change` scope
- [x] 3.2 Define the six official invocation forms as declarative records (prefix + id-or-skill-name interpolation): `/opsx:<id>`, `/opsx-<id>`, `@opsx-<id>`, `/openspec-<skill>`, `/skill:openspec-<skill>`, `$openspec-<skill>`
- [x] 3.3 Implement table-driven command-string generation over the six forms using workflow metadata (workspace = no positional args; change = append change name)
- [x] 3.4 Replace `buildCommand(format, ...)` usages with candidate-based generation; dedupe candidates by output string
- [x] 3.5 Replace `SKILL_NAMES` / `CORE_COMMAND_LABELS` / `EXPANDED_COMMAND_LABELS` / uiText label lookups with the centralized metadata (retain public labels via the metadata module)
- [x] 3.6 Add tests: table-driven generation for all six forms, workflow metadata completeness, scope values (workspace-only vs change-only sets), skill-name interpolation (`sync` → `openspec-sync-specs`), workspace vs change argument appending (workspace copies carry no change name; change copies always append it)

## 4. Phase 4 - Tools UI and copy-time selector

- [x] 4.1 Rename the Settings sidebar section `Workflow` → `Tools` (short label; in-page heading may be more descriptive); update `uiText.ts` section labels and Settings section ids/navigation
- [x] 4.2 Render the read-only Tools section: mechanism explanation, supported-tools docs link via the shared URL constant, guidance that re-running `openspec init` adds/removes per-repository tool integrations, detected-integration list (tool name, Commands/Skills delivery, example invocation, detection source), and a refresh control that re-runs detection
- [x] 4.3 Use copy describing "OpenSpec integrations configured for this repository"; never "installed tools"; no selection/format-fixing controls in the section
- [x] 4.4 Remove the three format option cards (Standard / Claude Code / Skill) and `setFormat` from `SettingsView.svelte`; keep the Commands visibility section unchanged
- [x] 4.5 Implement copy-time candidate selection in `CommandShortcutBar` / `CommandChip`: exactly one detected tool copies directly; multiple detected tools open a `Choose tool` menu and copy only on explicit selection; zero detections offer supported tool names; `Other tool…` exposes undetected tools and custom commands; invocation forms remain internal
- [x] 4.6 Implement accessibility for the candidate menu: keyboard navigation (arrow keys, Enter, Escape), proper `aria-*` attributes, focus management, and a menu role consistent with existing shadcn patterns
- [x] 4.7 Add tests: Tools section read-only content, docs link + init guidance present, refresh updates the list, copy flows (single direct / multi-tool menu with explicit selection / zero shows supported tools / Other tool), same-command tools remain separate while duplicate tool+form evidence is deduplicated, no last-tool auto-copy, accessibility (keyboard/menu/aria)

## 5. Phase 5 - Preference migration and API cleanup

- [x] 5.1 Migrate `openspec-command-preferences`: ignore stored `format` and legacy `aiTool` values on load; drop them on the next preferences write; preserve `commandVisibility`
- [x] 5.2 Remove the `CommandFormat` type and `normalizeCommandFormat` / legacy normalization paths; remove `format` from the preferences store API and UI
- [x] 5.3 Remove deprecated `availableExpandedCommands` usage and field from client types (server may keep during a transition window per the staged deprecation, or remove in coordination with the API plan)
- [x] 5.4 Add tests: old `format: 'claude-code'` ignored after upgrade, legacy `aiTool: 'default'` ignored, retired fields cleaned on next write, visibility preferences preserved

## 6. Regression and final validation

- [x] 6.1 Run the full test suite (frontend unit + server integration) and fix regressions
- [x] 6.2 Verify workspace/change command rows on Dashboard, Explorer Pane, Home drawer, and ChangeViewer render the correct chips with the new availability truth: workspace shows only `propose`, `explore`, `new`, `bulk-archive` (never `continue`/`ff`/`apply`/`update`/`verify`/`sync`/`archive`/`onboard`); change surfaces show the change-only set with known change names appended
- [x] 6.3 Verify Settings Tools + Commands sections render correctly with the renamed sidebar item
- [x] 6.4 Verify onboard is absent from all surfaces including the availability response and detection output

## 7. Post-implementation UX corrections

- [x] 7.1 Make the Dashboard `Next Step` command row a non-navigating region so command activation completes on Dashboard without opening the Change detail view
- [x] 7.2 Expose server-derived `toolOptions` through command availability so the frontend does not maintain a duplicate tool catalog
- [x] 7.3 Replace format-named copy choices with tool-named choices; keep tools distinct even when their generated command strings match, and expose undetected choices through `Other tool…`
- [x] 7.4 Add regression tests for Dashboard event isolation, single/multiple/zero tool choices, same-form tools, and the Shared `.agents` / Codex ambiguity

## 8. Dashboard command activation regression

- [x] 8.1 Remove outer pointer/keyboard propagation blockers that prevent the dropdown trigger and window handlers from completing their normal interaction
- [x] 8.2 Guarantee a tool-named fallback candidate set when availability returns no `toolOptions`, so a visible command chip can never become a zero-choice no-op
- [x] 8.3 Add regression tests for empty/stale availability, dropdown event wiring, direct copy fallback, and Dashboard non-navigation

## 9. Reviewer follow-up

- [x] 9.1 Implement ArrowUp/ArrowDown/Home/End navigation and open/close focus management for the `Choose tool` menu, with direct behavioral tests
- [x] 9.2 Add direct unit coverage for malformed OpenSpec CLI config output, delivery degradation, runner failures, onboard filtering, and retained detection hints
- [x] 9.3 Remove the retired `settings_workflow_description` key from every locale and delete unused Tools/custom-format labels from `uiText.ts`
- [x] 9.4 Re-run the full suite, typecheck, production build, strict OpenSpec validation, and browser-level menu keyboard verification
