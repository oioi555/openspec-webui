## 1. Command builder helper

- [x] 1.1 Add `buildToolsInitCommand(path: string): string` to `frontend/src/lib/state/projectVersionStatusCore.ts` next to `buildProjectUpdateCommand`, returning `openspec init <path>` using the same whitespace-quoting rule as `buildProjectUpdateCommand` (wrap the path in single quotes when it contains whitespace; otherwise emit the bare path).
- [x] 1.2 Add unit tests in `frontend/src/lib/state/projectVersionStatusCore.test.ts` mirroring the existing `buildProjectUpdateCommand` tests: a typical path produces `openspec init /home/user/proj`, a whitespace path is single-quoted, and the `openspec init` token is always literal English.

## 2. Documentation URL constant

- [x] 2.1 Add `export const OPENSPEC_INIT_DOCS_URL = 'https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#openspec-init';` to `frontend/src/lib/openspecDocs.ts` next to the existing `OPENSPEC_*_DOCS_URL` constants.
- [x] 2.2 Add a unit test in `frontend/src/lib/openspecDocs.test.ts` asserting `OPENSPEC_INIT_DOCS_URL` equals the expected `cli.md#openspec-init` URL.

## 3. Localized message keys and fixed labels

- [x] 3.1 Add the keys `settings_tools_init_command_caption`, `settings_tools_init_command_aria`, and `settings_tools_no_active_project` to `frontend/messages/en.json` with English copy that references the active repository and the `openspec init` command without translating the `openspec init` token.
- [x] 3.2 Add the same three keys with translated copy to every other supported locale file under `frontend/messages/` (at least `de.json`, `es.json`, `pt-BR.json`, `fr.json`, `ja.json`, `zh-CN.json`), keeping the `openspec init` token in English.
- [x] 3.3 Add the new keys to the appropriate message-id / text-id lists in `frontend/src/lib/uiText.ts` (e.g. the `m.settings_tools_*` message id constants used by the Tools section) so the Svelte markup can reference them.
- [x] 3.4 Add a new `initCommand` entry under `FIXED_LABELS.settings.docs` in `frontend/src/lib/uiText.ts` (alongside the existing `supportedTools` label) with a fixed English label such as `openspec init reference`, since the label names a command and should stay in English per the ui-localization rule.

## 4. Tools section markup and state wiring

- [x] 4.1 In `frontend/src/lib/components/layout/SettingsView.svelte`, import `buildToolsInitCommand` from `$lib/state/projectVersionStatusCore` next to the existing `buildProjectUpdateCommand` import, and add `OPENSPEC_INIT_DOCS_URL` to the existing import from `$lib/openspecDocs`.
- [x] 4.2 Add a `$derived` `activeRepositoryPath` computed from `projectStore.projects.find((p) => p.id === projectStore.activeProjectId)?.path ?? null`.
- [x] 4.3 Inside the Tools section `<SurfaceCard>` body, below the detected-integration list, render a copyable command block containing `openspec init <activeRepositoryPath>` with the active repository path surfaced inside the command (full path available via the element `title` attribute when the visible command is truncated). The block reuses the Versions section's per-tool update command affordance (caption + `rounded-sm border` code block + Copy icon button) and is wired to `handleCopyCommand(buildToolsInitCommand(activeRepositoryPath), activeRepositoryPath)`. The block is a supplement to the detected-integration list (the section's primary content), not an `InsetPanel` at the top of the body.
- [x] 4.4 Render the localized `settings_tools_init_command_caption` above the command block and use `settings_tools_init_command_aria` as the copy button's `aria-label` (include the project path in the aria text for screen readers).
- [x] 4.5 When `activeRepositoryPath` is `null`, render the localized `settings_tools_no_active_project` empty-state message in place of the path display and copyable command block, while keeping the supported-tools and init-reference documentation links, refresh control, and existing read-only constraints visible.
- [x] 4.6 In the existing Tools section docs-link paragraph, append a second `·`-divided link pointing to `OPENSPEC_INIT_DOCS_URL` with the `FIXED_LABELS.settings.docs.initCommand` label and the same `ExternalLink` affordance as the supported-tools link, matching the Commands section's multi-link pattern.
- [x] 4.7 Preserve the existing supported-tools documentation link, detected-integration list, "no integrations" `Callout`, and refresh button in their current positions and behaviors; do not add any selection, format-fixing, or execution control.

## 5. Tests

- [x] 5.1 Update `frontend/src/lib/components/layout/settingsTab.test.ts` to assert the new Tools section structure: the copyable init command block below the detected-integration list (Versions-style caption + `rounded-sm border` block + Copy button), the active repository path surfaced via the block's `title` attribute, the `buildToolsInitCommand` import, the `handleCopyCommand(buildToolsInitCommand(activeRepositoryPath), activeRepositoryPath)` wiring, the `OPENSPEC_INIT_DOCS_URL` import, and the presence of the init-reference link next to the supported-tools link.
- [x] 5.2 Add assertions that when no project is active the Tools section renders the `settings_tools_no_active_project` empty-state message and still renders both documentation links and the refresh control.
- [x] 5.3 Extend `frontend/src/lib/locale.test.ts` so the "keep `openspec init` in English" rule covers the new Tools-section message keys across every supported locale file.

## 6. Verification

- [x] 6.1 Run the frontend unit tests (`npm test` scoped to the affected files, or the project's configured test command) and confirm the new helper tests, URL-constant test, updated settings tests, and localization tests all pass.
- [x] 6.2 Run `openspec validate tools-section-show-repo-and-copy-init --strict` and `openspec validate --type all --strict` from the repo root, and fix any reported issues.
- [x] 6.3 Manually verify in the running app: the Tools section shows the active repository path, the copy button copies `openspec init <path>` to the clipboard, the docs-link paragraph shows both the supported-tools link and the `openspec init` reference link, switching projects updates the path and command reactively, no-project state shows the empty-state message, and the refresh button and detected-integration list still behave as before.
