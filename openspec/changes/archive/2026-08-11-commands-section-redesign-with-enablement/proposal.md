## Why

The Settings → Commands section lists every workflow command with a label and a status line, but the label alone rarely tells the operator what the command actually does (`ff` is "Fast Forward" of what? `sync` syncs what with what?). The status line is also redundant with the checkbox's enabled/disabled state, and the section pretends Core Commands are "always available" even though a custom OpenSpec profile (or a stale pre-1.6 config) can omit any command — Core or Expanded — from the CLI-reported `workflows` list, in which case the checkbox still toggles but the command never renders on Dashboard / ChangeViewer. On top of that, the Commands section has no refresh button of its own and offers no guidance for how to add a missing command.

## What Changes

- Add a one-line localized description for every workflow command shown in the Commands section, sourced from a new field on the workflow metadata structure so the metadata stays the single source of truth.
- Treat the Core Commands and Expanded Commands groups as **classifications only**: both groups SHALL apply the same availability rule (a command is toggleable only when present in the CLI-reported `workflows` list). The OpenSpec `core` profile is the default set, not a guarantee that those commands are always present.
- Replace every Commands section checkbox with a **checkbox / circle-off pair**: the row renders a normal checkbox (matching the checkbox styling used by other Settings sections) when the command is in the `workflows` list, and renders a circle-off icon in place of the checkbox when the command is absent from the list (not toggleable from this row). Drop all per-row "always available", "available", "unavailable", and "waiting" status strings, drop the shared availability caption, and drop the warning Callout whose trigger was "Expanded commands are unavailable" — the checkbox / circle-off pair is the single source of per-row availability truth.
- Render, below the command groups and **always visible**, a single copyable command block for `openspec config profile` using the same code-plus-copy-button affordance used by the Tools and Versions sections, with a caption explaining that the command opens the interactive global workflow selector and that running `openspec update` in the project is required afterwards. Do not include an `openspec update` copy block here (it must be run per-project, and the Versions section already provides a path-scoped `openspec update` copy).
- Render every Commands section row with the same checkbox styling used by other Settings sections (General, Validation) when the command is present in the CLI-reported `workflows` list, and with a circle-off icon in place of the checkbox when the command is absent from the list. Do not render any shared availability caption — Core and Expanded are classifications only and the checkbox / circle-off pair already tells the operator everything they need.
- Add a refresh button to the Commands section header that calls the same `commandPreferencesStore.refreshAvailability()` flow already used by the Tools section.
- Keep the section read-only with respect to execution: copying `openspec config profile` places it on the clipboard only; nothing is executed from the browser. The existing Core/Expanded command grouping, the `onboard` block, the documentation links, and the existing visibility-toggle persistence behavior are preserved.
- Fix the Commands section header profile indicator to label the reported profile as a **global** profile (matching the global nature of `openspec config profile` and the section's other "global OpenSpec workflows" copy); the earlier "Local profile" wording was incorrect because OpenSpec profiles are global.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `command-preferences`: Replace the checkbox + per-row status-line model with the three-state availability icon model; require the shared availability caption; require the always-visible `openspec config profile` copy block; require the Commands-section refresh control; require the one-line per-command description sourced from workflow metadata; preserve the Core/Expanded classification and the existing grouping/persistence rules.
- `ui-localization`: Require localization, in every supported locale, of (a) the new per-command description keys (one per workflow command), (b) the shared availability caption rendered once for both groups, and (c) the `openspec config profile` copy-block caption and copy-button aria label. Keep command tokens (`openspec config profile`, `openspec update`, `openspec init`) in English across locales, consistent with the existing `openspec init` English-token rule.

## Impact

- **Frontend markup**: `frontend/src/lib/components/layout/SettingsView.svelte` Commands section — add refresh button to SectionHeader, render per-command description, replace checkbox with three-state availability icon, render shared availability caption, render always-visible `openspec config profile` copy block, remove warning Callout enablement guide and per-row status strings.
- **Workflow metadata**: `frontend/src/lib/workflowMetadata.ts` — `descriptionMessageId` field (already added in earlier iteration) stays.
- **UI text**: `frontend/src/lib/uiText.ts` — `getWorkflowCommandDescription` helper (already added) stays.
- **Localization**: `frontend/messages/*.json` (7 locales) — keep the per-command description keys and the refresh-aria key; drop the now-unused enablement-guide and expanded-unavailable-marker keys; replace the Core-only caption key with the shared availability caption key; add the `openspec config profile` copy-block caption and aria keys. Keep CLI command tokens in English.
- **Tests**: `frontend/src/lib/components/layout/settingsTab.test.ts` — update Commands-section structure assertions for the three-state icon, shared caption, and always-visible copy block; drop assertions for the removed enablement guide and per-row markers.
- **No API or server changes**: the existing `GET /api/commands/availability` endpoint and `refreshAvailability()` flow are reused as-is.
- **No breaking changes**: visual and copy-only reorganization of an existing section; persistence shape unchanged.
