## Context

The Commands section of `frontend/src/lib/components/layout/SettingsView.svelte` today renders two groups — Core Commands and Expanded Commands — where every row is a label, a status line, and a checkbox that toggles command visibility. Four problems make the section hard to use and actively misleading:

1. The label alone does not explain what the command does (`ff` is "Fast Forward" of what? `sync` syncs what?). There is no per-command description field; `workflowMetadata.ts` carries only `{ id, label, scope, skillName }`.
2. The per-row status copy is redundant with the checkbox's enabled/disabled state. Core rows repeat "Always available from the WebUI." and Expanded rows repeat "Available / Not available / Waiting" — all of which is already implied by the checkbox.
3. The section pretends Core Commands are always available, but the OpenSpec `core` profile is only the default set. A custom profile (or a stale pre-1.6 config) can omit any command — Core or Expanded — from the CLI-reported `workflows` list, in which case the checkbox still toggles but the command never renders on Dashboard / ChangeViewer. The spec's "workflows is the single source of truth" rule (`command-shortcuts` spec) confirms that the workflows list, not the core/expanded classification, decides what renders.
4. The section has no refresh button of its own (the operator has to leave to the Tools section to re-detect workflows) and the only affordance for adding a missing Expanded command is a heavy warning Callout that doesn't apply once Core and Expanded are treated symmetrically.

The Versions and Tools sections already demonstrate the copy affordance we want for the global selector command, and the Tools section already demonstrates the refresh button and the `commandPreferencesStore.availability` / `.availabilityLoading` state that the Commands section also reads. This change redesigns the Commands section to be flat, honest, and self-serviceable.

See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Tell operators what each command does without forcing them to read external docs.
- Make the Commands section tell the truth about which commands will actually render, for both Core and Expanded.
- Collapse checkbox state and availability into a single three-state icon per row, killing the redundant per-row status strings and the warning Callout.
- Give operators a single always-visible self-service path (`openspec config profile` copy block) to add any missing command, without executing anything from the browser.
- Let operators re-detect workflows from inside the Commands section.

**Non-Goals:**
- Execute any CLI command from the browser. The copy block is copy-only, matching the Versions and Tools sections.
- Change the command visibility persistence shape, the API, the availability detection logic, or the Core/Expanded classification itself (`sync` and `update` stay classified as Core; `onboard` stays hidden). The groups stay as groupings; what changes is that neither group is treated as "always available".
- Add an `openspec update` copy block inside the Commands section. `openspec update` must be run per-project, and the Versions section already provides a path-scoped `openspec update` copy block. Adding a second one here would be redundant and would invite operators to run it from the wrong cwd.
- Add per-command documentation tooltips, long-form docs, or links to external references beyond what the section already links to.
- Touch the Tools, General, Validation, or Versions sections beyond shared helpers (`handleCopyCommand`, `commandPreferencesStore.refreshAvailability`).

## Decisions

### Decision 1: Extend `WorkflowMetadata` with a `descriptionMessageId` field
**Choice:** Add a `descriptionMessageId: keyof typeof m` field to the `WorkflowMetadata` interface in `frontend/src/lib/workflowMetadata.ts`, populated for every command shown in the Commands section. Add a `getWorkflowCommandDescription(id)` helper in `frontend/src/lib/uiText.ts` parallel to `getWorkflowCommandLabel(id)`, which returns the localized description via the paraglide message helper.

**Rationale:** `workflowMetadata.ts` is already documented as the single source of truth for workflow metadata; extending it with a description-message-id keeps label and description co-located and keeps the display layer (`uiText.ts`) thin. Using a message id (not a literal string) preserves the ui-localization rule that user-facing copy must be translatable, and lets `frontend/src/lib/locale.test.ts` enforce the English-token rule uniformly. This decision is unchanged from the earlier iteration and is already implemented.

### Decision 2: Render a checkbox or a circle-off icon per row, matching other Settings sections
**Choice:** Render a normal `<input type="checkbox">` (matching the checkbox styling used by the General and Validation sections) when the command is present in the CLI-reported `workflows` list, and render a `CircleOff` icon in place of the checkbox when the command is absent from the list. The checkbox toggles `commandVisibility[command]` via the same persistence path as before (`commandPreferencesStore.setCommandVisibility`). The circle-off icon is not interactive. While `availabilityLoading` is true, the checkbox is disabled.

Drop all per-row status strings ("always available", "available", "unavailable", "waiting"), the per-row unavailable marker, the shared availability caption, and the warning Callout whose trigger was "Expanded commands are unavailable". The checkbox / circle-off pair is the single source of per-row availability truth.

**Rationale:** The user explicitly asked to keep the checkbox so the Commands section is visually consistent with the General and Validation sections, and to use the circle-off icon only for the "not in your workflows" case. Once Core and Expanded are treated symmetrically, there is nothing to explain with a caption — the checkbox / circle-off pair already tells the operator everything they need, and the always-visible `openspec config profile` copy block (Decision 5) gives them the recovery path.

**Alternatives considered:**
- Three-state icon (check / empty-square / circle-off). Rejected by the user: other Settings sections use checkboxes, so replacing the checkbox with an icon diverges from the rest of Settings for no net benefit.
- Keep the checkbox but disable it when the command is absent from the workflows list, and render a marker next to it. Rejected: the user explicitly asked for the circle-off icon in place of the disabled checkbox instead.
- Hide rows whose commands are absent from the workflows list. Rejected: hiding the row removes the signal that the command exists but is currently unavailable.

### Decision 4: Add a refresh button to the Commands section header
**Choice:** Mirror the Tools section's refresh button markup in the Commands section's `SectionHeader`: same `RefreshCw` icon, same `variant="ghost" size="icon"` styling, same `disabled={commandPreferencesStore.availabilityLoading}` / spin animation, same `onclick={() => commandPreferencesStore.refreshAvailability()}` wiring. The button's `aria-label` uses the Commands-section-localized `settings_commands_refresh_aria` key.

**Rationale:** The Commands section already reads `commandPreferencesStore.availability` / `.availabilityLoading`, so adding the second button is a markup-only change with no new state or API. Because any command — Core or Expanded — can be absent from the workflows list, in-section refresh is genuinely useful (the operator just ran `openspec config profile` + `openspec update` in a terminal and wants to re-detect). Placing it in the header matches the Tools section's layout. This decision is unchanged from the earlier iteration and is already implemented.

### Decision 5: Render an always-visible `openspec config profile` copy block below the command groups
**Choice:** Below the Core Commands and Expanded Commands groups, always render a single copyable command block for `openspec config profile` using the same code-plus-copy-button affordance used by the Tools (`openspec init <path>`) and Versions (`openspec update <path>`) sections. The block is **always visible**, regardless of which commands are or are not in the workflows list. Its caption uses a new key `settings_commands_config_profile_caption` and explains that the command opens the interactive global workflow selector and that running `openspec update` in the project is required afterwards. The copy-button aria uses a new key `settings_commands_config_profile_aria`. Clicking the button calls `handleCopyCommand('openspec config profile', 'openspec config profile')` and places the command on the clipboard only.

Remove the earlier iteration's warning-Callout enablement guide entirely (the `Callout variant="warning"` + `InsetPanel` + two copy blocks for `openspec config profile` and `openspec update` + refresh hint). That guide was conditioned on "Expanded commands are unavailable" and no longer applies now that Core and Expanded are treated symmetrically.

**Rationale:** `openspec config profile` is the global, interactive selector for any workflow — Core or Expanded — so a single always-visible copy block covers every missing-command case. The block is unconditional, which means the operator never has to first trigger a warning state to find the self-service path. `openspec update` is intentionally not included here: it must be run per-project, the Versions section already provides a path-scoped `openspec update` copy block, and a path-less `openspec update` copied from this section would invite operators to run it from the wrong cwd. Reusing the Tools/Versions copy-block pattern keeps the three Settings surfaces visually consistent.

**Alternatives considered:**
- Keep the two-command warning Callout. Rejected: the user explicitly asked to drop it ("Expanded Commands を有効化の警告パネルも不要になるから廃止") and it does not apply once Core and Expanded are symmetric.
- Include `openspec update` here as a second copy block. Rejected: per-project, redundant with Versions, and the user explicitly excluded it.
- Make the copy block conditional on any command being missing. Rejected: making it always visible is simpler and matches the Tools section's always-visible `openspec init` copy block.

### Decision 6: Locale key composition
**Choice:**
- **Keep**: `settings_command_desc_<command>` (11 keys, one per command), `settings_commands_refresh_aria` (Commands refresh button aria). These are unchanged from the earlier iteration.
- **Add**: `settings_commands_config_profile_caption` (the copy-block caption from Decision 5), `settings_commands_config_profile_aria` (the copy-block button aria from Decision 5).
- **Remove**: the earlier iteration's now-unused keys — `settings_commands_core_always_available_caption`, `settings_commands_expanded_unavailable_marker`, `settings_commands_expanded_enablement_heading`, `settings_commands_expanded_enablement_body`, `settings_commands_expanded_enablement_step_config`, `settings_commands_expanded_enablement_step_update`, `settings_commands_expanded_enablement_step_config_aria`, `settings_commands_expanded_enablement_step_update_aria`, `settings_commands_expanded_enablement_refresh_hint` — from every locale file. Also remove the same keys from the `locale.test.ts` English-token-rule list if they were added there.

**Rationale:** The flat design produces strictly fewer keys, and leaving the dead keys in the locale files would re-create the exact "garbage pile" problem the user called out after the Tools-section change. Removing them in the same change keeps the locale files honest. The English-token rule in `locale.test.ts` only needs to cover keys whose values contain CLI command tokens; the removed keys included some that did (`*_step_config_aria`, `*_step_update_aria`), so the rule list must be updated in lockstep.

**Alternatives considered:**
- Keep the dead keys for a separate cleanup change. Rejected: the user has twice now asked for garbage collection in the same change that produces it; deferring it again would repeat the pattern.

## Risks / Trade-offs

- **[Circle-off icon discoverability]** A first-time operator may not immediately read the circle-off icon as "not in your workflows". → Mitigated by the always-visible `openspec config profile` copy block (Decision 5), which gives them the recovery path without making them diagnose the icon first.
- **[Click target size]** Icons can be harder to click than checkboxes. → Match the Tools/Versions copy-button sizing (`size-8` hit area) so the click target is the same as the rest of Settings.
- **[Refresh button double-fires]** Two refresh buttons (Tools + Commands) could both be clicked quickly. → The store already sets `availabilityLoading = true` synchronously at the start of `refreshAvailability()` and both buttons gate on it, so the second click is suppressed. No new guard is required.
- **[Description text drift from official docs]** Hand-written descriptions could drift from OpenSpec's official docs. → Tasks include a verification step that cross-checks the English base descriptions against the official docs surfaced by @librarian; locale tests guard the English command tokens.
- **[Test coupling]** `settingsTab.test.ts` asserts on Commands-section structure. → Tasks include updating those assertions in the same step that adds the new markup, and `locale.test.ts` is updated to cover the new keys and drop the removed keys.
