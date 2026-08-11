## 1. Label rename (single source of truth)

- [x] 1.1 In `frontend/src/lib/workflowMetadata.ts`, change the `update` entry's `label` from `'Revise Plan'` to `'Update'`, and update the doc comment on the `label` field (and any inline comment near the `update` entry) to drop the "Revise Plan, distinct from the CLI `openspec update`" note and instead note that the label now matches the upstream `/opsx:update` command name.
- [x] 1.2 In `frontend/src/lib/uiText.ts`, change the duplicate `update: 'Revise Plan'` entry to `update: 'Update'` so the fallback map matches `workflowMetadata.ts`.

## 2. Comment update in commandShortcuts

- [x] 2.1 In `frontend/src/lib/commandShortcuts.ts`, update the comment that mentions `Revise Plan` (around line 190) so it refers to the `update` workflow label as `Update`, consistent with `workflowMetadata.ts`.

## 3. Per-command description aligned to official wording

- [x] 3.1 In `frontend/messages/en.json`, change the `settings_command_desc_update` value from "Revise the change's planning artifacts to keep them coherent." to "Revise a change's planning artifacts and keep them coherent" (match the official OpenSpec command reference wording).
- [x] 3.2 In `frontend/messages/{de,es,fr,ja,pt-BR,zh-CN}.json`, update the `settings_command_desc_update` translation to match the new English wording's meaning ("a change's" rather than "the change's", and "and keep them coherent" rather than "to keep them coherent"), keeping each locale's established style for "change", "planning artifacts", and "coherent".

## 4. Test assertions

- [x] 4.1 In `frontend/src/lib/workflowMetadata.test.ts`, update the test that asserts `metadata.label === 'Revise Plan'` and `getWorkflowLabel('update') === 'Revise Plan'` (and the test name that mentions "Revise Plan") to expect `'Update'`.
- [x] 4.2 In `frontend/src/lib/commandTypes.test.ts`, update the test that asserts `update: { id: 'update', label: 'Revise Plan'` (and the test name that mentions "Revise Plan") to expect `label: 'Update'`.
- [x] 4.3 In `frontend/src/lib/components/layout/settingsTab.test.ts`, update the assertions that pin `Revise Plan` (around the command-shortcut source match lines) to expect `Update`. Update any test comments that mention "Revise Plan".

## 5. Verification

- [x] 5.1 Run `npm test` and confirm all tests pass.
- [x] 5.2 Run `openspec validate rename-update-label-to-update --strict` and `openspec validate --type all --strict` from the repo root, and fix any reported issues.
- [x] 5.3 Manually verify: the Commands section row for `update` shows the label `Update` and the description "Revise a change's planning artifacts and keep them coherent"; a Dashboard / ChangeViewer `CommandChip` for `update` reads `Update`; no surface in the app shows `Revise Plan` anymore.
