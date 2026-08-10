## Context

The Tools & Integrations section in `frontend/src/lib/components/layout/SettingsView.svelte` (lines 418–487) currently renders a read-only list of detected OpenSpec integrations for the active repository, a refresh button, and a supported-tools documentation link. It says "OpenSpec integrations configured for this repository" but never names the repository, and its only affordance for changing those integrations is a sentence mentioning `openspec init`. The Versions section of the same component already solves two adjacent problems we now need: it shows per-project paths with truncation (`SettingsView.svelte:789-816`) and it renders copyable update commands with a code-plus-copy-button affordance (`SettingsView.svelte:761-775`, helper `buildProjectUpdateCommand` in `frontend/src/lib/state/projectVersionStatusCore.ts:170`). This change reuses that pattern inside the Tools section.

See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Make the Tools section's scope unambiguous by surfacing the active repository path.
- Let the operator copy `openspec init <active-repository-path>` from the Tools section without retyping the path, reusing the Versions section's copy affordance.
- Preserve every existing read-only guarantee of the Tools section: no format selection, no execution from the browser, supported-tools docs link, refresh control, detected-integration list with its current columns, and the "configured for this repository" wording.
- Keep the `openspec init` token in English across every supported locale.

**Non-Goals:**
- Execute `openspec init` from the browser. The new control is copy-only.
- Discover or render integrations for projects other than the active one. The path display and copyable command are scoped to the active project only.
- Change detection logic, API shape, or the `commandPreferencesStore` / `availabilityLoading` flow that feeds the integration list.
- Restyle the Commands, General, Validation, or Versions sections.

## Decisions

### Decision 1: Resolve the active repository path inline from `projectStore`
**Choice:** Compute `activeRepositoryPath` in `SettingsView.svelte` from `projectStore.projects.find(p => p.id === projectStore.activeProjectId)?.path ?? null`.

**Rationale:** `projectStore` is already imported and used by the Versions section's project list in the same component, so no new store, API, or prop wiring is needed. The active project's `path` is the same value already used elsewhere (e.g. `buildProjectUpdateCommand(project.path)`), which keeps the path shown in Tools consistent with the path used by Versions.

**Alternatives considered:**
- Add a `getActiveProject()` helper on `projectStore`. Rejected for this change: it would be a wider API change for a single consumer; can be refactored later if more surfaces need it.
- Pass the active project in as a prop. Rejected: the component already reads `projectStore` directly for Versions; a second access path would split the source of truth.

### Decision 2: Reuse the Versions copy-command pattern via a new `buildToolsInitCommand` helper
**Choice:** Add `buildToolsInitCommand(path: string): string` to `frontend/src/lib/state/projectVersionStatusCore.ts` next to `buildProjectUpdateCommand`, returning `openspec init <path>` with the same whitespace-quoting rule (`openspec init '<path>'` when the path contains whitespace; otherwise the bare path). Wire it to the existing `handleCopyCommand` used by Versions.

**Rationale:** The Versions section already solves command rendering, whitespace handling, and clipboard wiring. A sibling helper keeps the quoting rule consistent and testable in isolation (see existing `buildProjectUpdateCommand` tests in `projectVersionStatusCore.test.ts:128-138`). Keeping the helper next to `buildProjectUpdateCommand` avoids inventing a new home and matches the existing test layout.

**Alternatives considered:**
- Inline `openspec init ${path}` in the Svelte markup. Rejected: loses the whitespace-quoting rule and is harder to unit-test.
- Generalize into `buildOpenSpecCommand(verb, path)`. Rejected for now: only two call sites exist; the explicit pair is easier to read and grep. Can be consolidated later if a third verb appears.

### Decision 3: Place the copyable init command below the detected-integration list, no `InsetPanel`
**Choice:** Keep the Tools section's existing `SurfaceCard` + `SectionHeader` (heading, description, refresh button), and place the copyable init command block directly inside the section body below the detected-integration list (not wrapped in an `InsetPanel`). The detected-integration list is the section's primary content; the init command is a supplement for changing it, so it sits beneath the list at a lower visual weight that matches the Versions section's per-tool update command block. The existing supported-tools documentation link, detected-integration list, refresh control, and "no integrations" `Callout` stay where they are.

**Rationale:** The user explicitly asked for the init command to be treated as a supplement rather than as the section's headline content, which ruled out the originally proposed `InsetPanel` at the top of the body. Placing it below the list and reusing the Versions section's plain code-plus-copy-button affordance (same caption typography, same `rounded-sm border` block, same `size-8` button) keeps the visual hierarchy correct (primary content first, supplement second) while still satisfying the spec requirement that the block reuse the Versions update-command affordance. Keeping the `SurfaceCard` shell means the sidebar anchor, refresh button, and heading behavior are unchanged.

**Alternatives considered:**
- Wrap the block in an `InsetPanel` at the top of the body (the original design). Rejected by the user: the panel made the supplement more prominent than the primary content.
- Put the path display in the `SectionHeader`. Rejected: the header already hosts the heading, description, and refresh button; adding the path there would crowd it and hurt responsive behavior.
- Flatten the whole section into one `InsetPanel`. Rejected: would change the heading/anchor structure and break the existing `data-settings-section="tools"` hook used by `settingsTab.test.ts`.

### Decision 4: Show an empty state when no project is active
**Choice:** When `activeRepositoryPath` is `null`, render an empty-state message in place of the path display and copyable init command block, and keep the supported-tools documentation link, refresh control, and read-only constraints visible.

**Rationale:** The Versions section has an analogous fallback (`settings_versions_no_registered_projects`). A dedicated Tools-section empty-state message is clearer than hiding the block silently and keeps the section usable for documentation browsing even without a selected project.

**Alternatives considered:**
- Hide the whole section when no project is active. Rejected: breaks the sidebar anchor, the refresh control, and the documentation link, all of which remain useful.
- Disable the copy button but keep the path placeholder empty. Rejected: ambiguous and less readable than an explicit empty-state message.

### Decision 5: Add new message keys; keep `settings_tools_description` intact
**Choice:** Add three localized message keys: `settings_tools_init_command_caption`, `settings_tools_init_command_aria`, and `settings_tools_no_active_project`. Leave `settings_tools_description` and the rest of the Tools section copy unchanged so the spec-required "OpenSpec integrations configured for this repository" wording is preserved verbatim.

**Rationale:** The existing `settings_tools_description` value is referenced by `tool-integration-detection` spec wording; rewriting it would risk breaking that contract. New keys keep the diff small, are easy to translate, and match the established `settings_*` naming convention in `frontend/messages/*.json`. The `openspec init` token inside the copied command is always English by construction (`buildToolsInitCommand` returns a literal `openspec init` prefix), so the ui-localization "keep `openspec init` in English" requirement holds without extra guards. An initially-proposed fourth key, `settings_tools_active_repository_label`, was removed after the design iteration dropped the standalone path display in favor of surfacing the path inside the copyable init command block; that key is no longer present in any locale file.

**Alternatives considered:**
- Extend `settings_tools_description` with a `{path}` placeholder. Rejected: would force every locale to re-translate an otherwise stable string and would still need a separate caption/aria key for the copy block.
- Keep a standalone `settings_tools_active_repository_label` heading above the init block. Rejected during design review: the heading duplicated information already visible in the command and added visual weight the user wanted removed.

### Decision 6: Add `OPENSPEC_INIT_DOCS_URL` and render it next to the supported-tools link
**Choice:** Add `export const OPENSPEC_INIT_DOCS_URL = 'https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#openspec-init';` to `frontend/src/lib/openspecDocs.ts` next to the existing URL constants. In the Tools section's existing docs-link paragraph (the one that currently hosts the supported-tools link), append a second link labelled via a new `FIXED_LABELS.settings.docs.initCommand` entry, separated from the supported-tools link by a `·` divider, matching how the Commands section renders its `commands` and `workflows` docs links together.

**Rationale:** The user asked for the `openspec init` reference to be reachable from this section, and the Commands section already demonstrates the `·`-divided multi-link pattern in the same file (`SettingsView.svelte:499-500`). Co-locating the new constant with the other `OPENSPEC_*_DOCS_URL` constants keeps the existing test layout in `openspecDocs.test.ts` applicable and satisfies the `tool-integration-detection` requirement that both docs links reuse shared URL constants. Putting both links in the same paragraph keeps the Tools section's documentation surface in one place rather than splitting it across the new command block and the header paragraph.

**Alternatives considered:**
- Put the init reference link inside the new copyable-command `InsetPanel`. Rejected: the user explicitly asked to keep it next to the existing supported-tools link rather than next to the command block.
- Add the link without a constant (inline URL). Rejected: would violate the existing "reuse shared OpenSpec docs URL constants" requirement and break the pattern every other docs link in the component follows.

## Risks / Trade-offs

- **[Stale path after project switch]** The active project can change while Settings is open. → `activeRepositoryPath` is a `$derived` value off `projectStore`, so it updates reactively; the copied command always reflects the current path at click time.
- **[Quoting drift between `buildToolsInitCommand` and `buildProjectUpdateCommand`]** Two helpers with the same quoting rule could diverge. → Co-locate them in `projectVersionStatusCore.ts` and add parallel unit tests in `projectVersionStatusCore.test.ts` so a quoting regression is caught by either test.
- **[Translation lag for new keys]** New keys must be added to all eight locale files (`en`, `de`, `es`, `pt-BR`, `fr`, `ja`, `zh-CN`, and any other supported locale). Missing keys fall back to English per the existing ui-localization rule, so the UI stays usable, but translations should land in the same change. → Tasks call out adding all locale files together, and `frontend/src/lib/locale.test.ts` already enforces the "keep `openspec init` in English" rule across locales, which guards the new keys too.
- **[Test coupling to markup structure]** `settingsTab.test.ts` asserts on the Tools section structure. → Tasks include updating those assertions for the new copyable init command block (Versions-style caption + `rounded-sm border` block + Copy button), the active repository path surfaced via the block's `title` attribute, and the additional init-reference documentation link, in the same step that adds the markup.
