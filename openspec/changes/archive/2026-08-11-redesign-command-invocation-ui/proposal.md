## Why

The current command-copy UI assumes one global AI-tool format (`standard` / `claude-code` / `skill`) persisted in localStorage, but OpenSpec v1.8 installs per-tool commands/skills into the repository and each tool spells the same workflow differently. The WebUI has no way to know which integrations a repository actually has, so it guesses a format and hardcodes availability via a core/expanded dichotomy instead of trusting the CLI. This makes copied commands wrong for the user's real tool, and leaves change-only workflows (`update`, `continue`, `ff`) in the wrong (workspace) surface.

## What Changes

- **BREAKING** Remove the global `standard | claude-code | skill` command-format selection setting (Workflow section in Settings). Commands are generated per-copy from detected invocation-form candidates for the active repository, never from a persisted format.
- **BREAKING** Classify workflows by whether the WebUI can identify the target from the copy surface: workspace-only `propose`, `explore`, `new`, `bulk-archive`; change-only `continue`, `ff`, `apply`, `update`, `verify`, `sync`, `archive`. Remove `update`, `continue`, and `ff` from the workspace command row; `update` joins change-scoped commands for unarchived changes in both incomplete and complete task states, labeled distinctly from the CLI `openspec update` (e.g., `Revise Plan`) and copied with the change name. All change-only commands copy with the known change name when rendered on a Change surface.
- Command availability is gated by the CLI/config `workflows` list as the single source of truth; the core/expanded dichotomy no longer decides whether a command may be shown. The `availableExpandedCommands` API field is deprecated (staged removal); the API gains `delivery`, detected integrations, and invocation-form candidates.
- Add read-only, repo-scoped detection of OpenSpec tool integrations (tool-specific `opsx-*` command files and `openspec-*` skill dirs). Detection is a hint, not authority: empty dirs are never detected, and zero detections never disable copy or label the repo unsupported.
- Rename the Settings sidebar item `Workflow` to `Tools`; the section becomes read-only with a supported-tools docs link, `openspec init` guidance, the detected-integration list (tool, Commands/Skills delivery, example invocation, source), and a refresh control. Wording is "OpenSpec integrations configured for this repository", not "installed tools".
- Copy UX: exactly one detected form copies directly (as today); multiple distinct forms open an explicit candidate menu on each activation; zero detections offer all six official invocation forms; undetected formats are reachable via `Other format…`. No remembered-last-format auto-copy, no global/repo/command-level fixing. Identical output strings from multiple tools collapse into one copy candidate but stay individually listed in Tools.
- Represent the six official invocation forms (`/opsx:<id>`, `/opsx-<id>`, `@opsx-<id>`, `/openspec-<skill>`, `/skill:openspec-<skill>`, `$openspec-<skill>`) and centralize workflow metadata (id, user label, `workspace | change` scope, skill name) in one place.
- Retire stored `format` / legacy `aiTool` localStorage values safely (ignored on load, removed on next write); command visibility preferences keep working.
- Staged rollout: (1) availability and change-scoping bug fixes (`update`/`continue`/`ff` workspace removal, CLI `workflows` gating), (2) server detection/API, (3) frontend invocation model, (4) Tools UI and copy-time selector, (5) old enum/API cleanup.

## Capabilities

### New Capabilities
- `tool-integration-detection`: repo-scoped, read-only detection of OpenSpec-generated per-tool commands/skills configured for the active repository, plus the read-only Settings Tools section that explains, links, guides `openspec init`, lists detected integrations, and refreshes.

### Modified Capabilities
- `command-preferences`: settings layout renames the `Workflow` section to `Tools` (read-only), and retired format/`aiTool` preferences are migrated/cleaned without affecting command visibility preferences.
- `command-shortcuts`: generation changes from a persisted format preference to invocation-form candidates (single/multi/zero detection, `Other format…`, dedupe); workspace row is limited to workspace-only commands (`propose`, `explore`, `new`, `bulk-archive`); change-only commands (`apply`, `continue`, `ff`, `update`, `verify`, `sync`, `archive`) render only on change surfaces and gain `update` in both task states; availability is gated by CLI `workflows` as the single truth; workflow metadata is centralized.

## Impact

- `src/server/openspec-config.ts`, `src/server/routes/api.ts`: availability response gains `delivery`, detected integrations, and invocation-form candidates; `availableExpandedCommands` deprecated; onboard blocking unchanged.
- New server detection module for scanning the active repository root for OpenSpec-generated tool artifacts.
- `frontend/src/lib/commandShortcuts.ts`, `commandTypes.ts`, `state/commandPreferencesCore.ts`, `state/commandPreferences.svelte.ts`, `api.ts`, `views/Dashboard.svelte`, `views/ChangeViewer.svelte`, `components/layout/ExplorerPane.svelte`, `components/layout/SettingsView.svelte`, `components/shared/CommandShortcutBar.svelte` + `command-chip`, `uiText.ts`, `openspecDocs.ts`, `paraglide` messages.
- Tests: unit + server integration for detection, forms, migration, copy UX, Tools page, accessibility.
- No package/dependency changes.
