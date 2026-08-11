## Why

The `update` workflow command (`/opsx:update`, skill `openspec-update-change`) is labeled `Revise Plan` throughout the WebUI, while every other workflow command uses its command name as the label (`Propose`, `Explore`, `Apply`, `Sync`, `Archive`, `New`, `Continue`, `Fast Forward`, `Verify`, `Bulk Archive`). The official OpenSpec command reference lists the command as `/opsx:update` with the one-line description "Revise a change's planning artifacts and keep them coherent" — the label `Revise Plan` is neither the command name nor the official description, and was introduced only to distinguish the workflow command from the CLI `openspec update` command. That disambiguation is no longer necessary: the Commands section now shows a per-command description that tells the operator exactly what `update` does, and the Versions section is the only place that surfaces the CLI `openspec update` command (with a path argument, in a copy block). Keeping `Revise Plan` makes the WebUI inconsistent with every other label and with the upstream command name.

## What Changes

- Rename the `update` workflow command label from `Revise Plan` to `Update` across the single source of truth (`workflowMetadata.ts`) and the duplicate label map in `uiText.ts`.
- Update the per-command description for `update` in every locale to match the official OpenSpec wording: "Revise a change's planning artifacts and keep them coherent" (replacing the earlier paraphrase "Revise the change's planning artifacts to keep them coherent.").
- Update affected comments and test assertions that pin the old `Revise Plan` label.
- Update the `command-shortcuts` spec to label the `update` command `Update` instead of `Revise Plan`.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `command-shortcuts`: The `update` command's chip and command-shortcut label SHALL be `Update` (matching the command name and the upstream `/opsx:update` reference), not `Revise Plan`.

## Impact

- **Workflow metadata**: `frontend/src/lib/workflowMetadata.ts` — `label: 'Revise Plan'` → `label: 'Update'`; update the doc comment that previously explained the `Revise Plan` distinction.
- **UI text**: `frontend/src/lib/uiText.ts` — the duplicate `update: 'Revise Plan'` entry → `update: 'Update'`.
- **Command shortcuts**: `frontend/src/lib/commandShortcuts.ts` — update the comment that mentions `Revise Plan`.
- **Localization**: `frontend/messages/*.json` (7 locales) — update the `settings_command_desc_update` value to match the official wording "Revise a change's planning artifacts and keep them coherent" (translated per locale; the `update` token inside the description stays as the English command name).
- **Tests**: `frontend/src/lib/workflowMetadata.test.ts`, `frontend/src/lib/commandTypes.test.ts`, `frontend/src/lib/components/layout/settingsTab.test.ts` — update assertions that pin `Revise Plan`.
- **Spec**: `openspec/specs/command-shortcuts/spec.md` — change `labeled \`Revise Plan\`` to `labeled \`Update\``.
- **No breaking changes**: the command id (`update`), skill name (`openspec-update-change`), visibility preference key, and CLI invocation (`/opsx:update`) are unchanged; only the displayed label and the description copy change.
