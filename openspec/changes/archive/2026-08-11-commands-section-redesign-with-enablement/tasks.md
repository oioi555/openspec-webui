## 1. Workflow metadata extension

- [x] 1.1 Add a `descriptionMessageId: keyof typeof m` field to the `WorkflowMetadata` interface in `frontend/src/lib/workflowMetadata.ts`, populated for every command shown in the Commands section (`propose`, `explore`, `apply`, `sync`, `archive`, `update`, `new`, `continue`, `ff`, `verify`, `bulk-archive`) pointing at the `settings_command_desc_<command>` keys.
- [x] 1.2 Update `frontend/src/lib/workflowMetadata.test.ts` to assert every listed command carries a non-empty `descriptionMessageId` that resolves through the paraglide message helper.
- [x] 1.3 Add `getWorkflowCommandDescription(id)` helper in `frontend/src/lib/uiText.ts` parallel to `getWorkflowCommandLabel(id)`.

## 2. Locale key composition

- [x] 2.1 Add `settings_commands_config_profile_caption` and `settings_commands_config_profile_aria` to `frontend/messages/en.json`. The flat design has no shared availability caption.
- [x] 2.2 Add the same two keys with translated copy to every other supported locale file under `frontend/messages/` (`de.json`, `es.json`, `fr.json`, `ja.json`, `pt-BR.json`, `zh-CN.json`), keeping command tokens (`openspec config profile`, `openspec update`) in English.
- [x] 2.3 Remove the now-unused earlier-iteration keys from every locale file (7 files total): `settings_commands_availability_caption`, `settings_commands_core_always_available_caption`, `settings_commands_expanded_unavailable_marker`, `settings_commands_expanded_enablement_heading`, `settings_commands_expanded_enablement_body`, `settings_commands_expanded_enablement_step_config`, `settings_commands_expanded_enablement_step_update`, `settings_commands_expanded_enablement_step_config_aria`, `settings_commands_expanded_enablement_step_update_aria`, `settings_commands_expanded_enablement_refresh_hint`, `settings_core_commands_description`, `settings_expanded_commands_description`. Keep the `settings_command_desc_<command>` keys and `settings_commands_refresh_aria` from the earlier iteration.
- [x] 2.4 Update `frontend/src/lib/locale.test.ts`: remove any of the removed keys from the "keep CLI command tokens in English" rule list, and add `settings_commands_config_profile_caption` and `settings_commands_config_profile_aria` to that list.

## 3. Commands section header refresh button

- [x] 3.1 Add a refresh button to the Commands section `SectionHeader` mirroring the Tools section refresh button markup: `RefreshCw` icon, `variant="ghost" size="icon"` styling, `disabled={commandPreferencesStore.availabilityLoading}`, spin class while loading, `onclick={() => commandPreferencesStore.refreshAvailability()}`, and a localized `aria-label` from the `settings_commands_refresh_aria` key.

## 4. Checkbox or circle-off icon per row (replaces status strings)

- [x] 4.1 Render a normal `<input type="checkbox">` (matching the checkbox styling used by the General and Validation sections) on every Commands section row — Core and Expanded alike — when the command is present in the CLI-reported `workflows` list. When the command is absent from the `workflows` list, render a `CircleOff` icon (from `@lucide/svelte`) in place of the checkbox.
- [x] 4.2 Wire the checkbox to toggle `commandPreferencesStore.commandVisibility[command]` via `commandPreferencesStore.setCommandVisibility`. The circle-off icon is not interactive. While `availabilityLoading` is true, the checkbox is `disabled`.
- [x] 4.3 Provide a localized `aria-label` for the circle-off icon ("Not available in your OpenSpec workflows").

## 5. Always-visible `openspec config profile` copy block

- [x] 5.1 Below the Core Commands and Expanded Commands groups, always render (unconditionally) a single copyable command block for the literal command `openspec config profile`, using the same code-plus-copy-button affordance used by the Tools (`openspec init <path>`) and Versions (`openspec update <path>`) sections: caption from `settings_commands_config_profile_caption`, `<code>openspec config profile</code>`, `Copy` icon button with `aria-label` from `settings_commands_config_profile_aria`, `onclick={() => handleCopyCommand('openspec config profile', 'openspec config profile')}`.
- [x] 5.2 The block is always visible regardless of which commands are or are not in the `workflows` list; activating the copy button places `openspec config profile` on the clipboard only and does not execute it.

## 6. Remove earlier-iteration enablement guide, per-row markers, and group descriptions

- [x] 6.1 Remove the warning `Callout` enablement guide and its `InsetPanel` body (heading, body, two copyable command blocks for `openspec config profile` and `openspec update`, and the refresh hint) that the earlier iteration added to the Commands section.
- [x] 6.2 Remove every per-row unavailable marker (`settings_commands_expanded_unavailable_marker`) and every per-row status string (`settings_expanded_available`, `settings_expanded_unavailable`, `settings_expanded_waiting`, `settings_core_commands_always_available`) from the Commands section markup. The checkbox / circle-off pair is the single source of per-row availability truth.
- [x] 6.3 Remove the Core Commands group description (`settings_core_commands_description`, "Always available...") and the Expanded Commands group description (`settings_expanded_commands_description`, "These commands depend on...") from the markup and from every locale file. Core and Expanded are classifications only; their per-group copy was misleading once both groups became workflow-gated. The section-level description (`settings_commands_description`) is preserved.

## 7. Per-row description (unchanged)

- [x] 7.1 Every Commands section row — Core and Expanded alike — renders the one-line description from `getWorkflowCommandDescription(command)` near the label.

## 8. Tests

- [x] 8.1 Update `frontend/src/lib/components/layout/settingsTab.test.ts` to assert the new Commands-section structure: the Commands refresh button; the per-row description; the checkbox + circle-off pair; the absence of any per-row status string, per-group Core/Expanded description, and warning Callout enablement guide; the always-visible `openspec config profile` copy block; and the copy wiring `handleCopyCommand('openspec config profile', 'openspec config profile')`.
- [x] 8.2 `frontend/src/lib/locale.test.ts` updated per Task 2.4 (removed keys dropped from the English-token rule list; new copy-block keys added).
- [x] 8.3 workflowMetadata tests for `descriptionMessageId` stay green.

## 9. Verification

- [x] 9.1 `npm test` passes (640/640).
- [x] 9.2 `openspec validate commands-section-redesign-with-enablement --strict` passes.
- [x] 9.3 Manual verification pending user run (each row shows description + checkbox/circle-off; Core command absent from workflows renders circle-off and is not toggleable; enablement guide gone; `openspec config profile` copy block always visible; refresh button re-detects workflows; header profile labeled "Global").
- [x] 9.4 English base descriptions cross-checked against the official OpenSpec docs surfaced during research (commands.md Quick Reference, workflows.md, getting-started.md); each description matches the documented behavior of its command.

## 10. Header profile indicator wording

- [x] 10.1 In every locale file (`frontend/messages/*.json`, 7 files), updated the `settings_commands_profile` value so it labels the reported profile as a global profile instead of a local one (en: "Global profile: {profile}"; de: "Globales Profil: {profile}"; es: "Perfil global: {profile}"; pt-BR: "Perfil global: {profile}"; fr: "Profil global : {profile}"; ja: "グローバルプロファイル: {profile}"; zh-CN: "全局配置：{profile}"). OpenSpec profiles are global; the earlier "Local profile" wording was incorrect.
