# command-shortcuts Specification

## Purpose
Generates and surfaces copyable OpenSpec commands in the web UI using tool-identified invocation candidates detected for the active repository, with visibility rules that adapt to workspace state and change completion status.

## Requirements

### Requirement: Show workspace-only command buttons on Dashboard and Changes
The system SHALL render copy-command buttons inline within the ACTIVE CHANGES section header surface using the `CommandChip` component from `$lib/components/shared/command-chip/`, whether that surface is shown in the persistent Explorer Pane or the temporary narrow-width Home drawer. The system SHALL include `propose` and `explore` only when those commands are present in the CLI-reported `workflows` list for the active project and are enabled via visibility settings, SHALL include `new` only when that command is present in the CLI-reported `workflows` list, is available, and is enabled, SHALL include `bulk-archive` only when at least one active change is fully complete and that command is present in the CLI-reported `workflows` list, is available, and is enabled, SHALL NOT include `continue`, `ff`, `apply`, `update`, `verify`, `sync`, or `archive` in the workspace command row, and SHALL NOT include `onboard` in the workspace command row. The row SHALL remain compact, SHALL wrap when many commands are visible, and SHALL preserve command-emphasis styling distinct from standard action buttons.

#### Scenario: Show enabled workspace commands on Home
- **WHEN** the operator views the Home surface and the CLI-reported `workflows` list includes `propose` and `explore`
- **THEN** the UI shows `CommandChip` controls for `propose` and `explore` if those commands are enabled via visibility settings

#### Scenario: Hide update from the workspace command row
- **WHEN** the workspace command row is rendered and the CLI-reported `workflows` list includes `update`
- **THEN** no `CommandChip` or generated command text for `update` is shown in the workspace command row

#### Scenario: Hide continue and ff from the workspace command row
- **WHEN** the workspace command row is rendered and at least one active change still has incomplete tasks and the CLI-reported `workflows` list includes `continue` and `ff`
- **THEN** no `CommandChip` or generated command text for `continue` or `ff` is shown in the workspace command row
- **AND** `continue` and `ff` remain available only on change-scoped command surfaces

#### Scenario: Show bulk archive when completed active changes exist
- **WHEN** at least one active change is fully complete and the CLI-reported `workflows` list includes `bulk-archive`
- **THEN** the UI shows a `CommandChip` for `bulk-archive` only if that command is available and enabled

#### Scenario: Wrap a dense workspace command row
- **WHEN** multiple workspace commands are simultaneously visible
- **THEN** the command row wraps across lines with compact spacing
- **AND** the chips remain visually grouped apart from surrounding title / count UI

#### Scenario: Copy a workspace command without arguments
- **WHEN** the operator activates a workspace command button with a single detected invocation form
- **THEN** the system copies only the command text
- **AND** does not append a change name

#### Scenario: Show workspace commands in narrow-width home drawer
- **WHEN** the viewport width is less than 768px and the operator opens the Home drawer
- **THEN** the ACTIVE CHANGES section header in that drawer shows the same `CommandChip` controls as the persistent Explorer Pane

#### Scenario: Hide onboard from the workspace command row
- **WHEN** the workspace command row is rendered
- **THEN** no `CommandChip` or generated command text for `onboard` is shown

### Requirement: Show change-scoped command buttons in ChangeViewer
The system SHALL render change-scoped copy-command buttons inline within the ChangeViewer header using `CommandChip` components. The system SHALL also render change-scoped copy-command buttons within each Dashboard Active Changes list item using `CommandChip` components via `CommandShortcutBar`. The system SHALL show `apply` only when the change still has incomplete tasks, `apply` is present in the CLI-reported `workflows` list for the active project, and the command is enabled; SHALL show `continue` and `ff` for incomplete changes only when those commands are present in the CLI-reported `workflows` list, are available, and are enabled; SHALL show `update` (labeled `Update`) for any active, unarchived change when `update` is present in the CLI-reported `workflows` list and the command is enabled, regardless of task completion status; and SHALL show `sync` for any active, unarchived change that has one or more spec deltas and the command is enabled, regardless of task completion status. The system SHALL show `verify` only when the change has no incomplete tasks and the command is enabled, and SHALL show `archive` only when the change has no incomplete tasks and the command is enabled. Change-scoped command chips SHALL be ordered left-to-right by workflow stage so later-stage actions appear farther right; incomplete changes SHALL order implementation-continuation commands before `sync` with `update` immediately after `apply`, and completed changes SHALL order commands as `verify`, `update`, `sync`, `archive`. In Dashboard list items, the command chips SHALL be visually separated from the primary open-change action and SHALL be preceded by a `Next Step` cue label. The entire `Next Step` command row, including its background and label, SHALL be a non-navigating command region. The primary change summary above that row SHALL remain the explicit open-change action.

#### Scenario: Show commands for an incomplete active change in Dashboard
- **WHEN** the Dashboard surface renders an active change with incomplete tasks and the CLI-reported `workflows` list includes `apply`, `update`, `continue`, and `ff`
- **THEN** that change item shows a `CommandChip` for `apply` only if enabled
- **AND** shows `update`, `continue`, and `ff` only if those commands are enabled

#### Scenario: Show update for a complete active change in Dashboard
- **WHEN** the Dashboard surface renders an active change whose tasks are all complete and the CLI-reported `workflows` list includes `update`
- **THEN** that change item shows a `CommandChip` for `update` only if enabled
- **AND** the `update` chip is labeled `Update`, matching the workflow command name `/opsx:update` (skill `openspec-update-change`)

#### Scenario: Show sync for an incomplete active change with spec deltas in Dashboard
- **WHEN** the Dashboard surface renders an active change with incomplete tasks and one or more spec deltas
- **THEN** that change item shows a `CommandChip` for `sync` only if enabled
- **AND** the `sync` command appears to the right of implementation-continuation commands in the command row

#### Scenario: Hide sync for an incomplete active change without spec deltas in Dashboard
- **WHEN** the Dashboard surface renders an active change with incomplete tasks and no spec deltas
- **THEN** that change item does not show a `CommandChip` for `sync`

#### Scenario: Show commands for a complete active change in Dashboard
- **WHEN** the Dashboard surface renders an active change whose tasks are all complete and that has one or more spec deltas
- **THEN** that change item shows `CommandChip` controls ordered as `verify`, `update`, `sync`, `archive` for the enabled commands

#### Scenario: Dashboard command row shows next-step cue
- **WHEN** the Dashboard renders change-scoped command chips for an active change
- **THEN** the command row shows a `Next Step` label before the command chips
- **AND** the cue remains visible even if only one command chip is shown

#### Scenario: Dashboard command chips do not open the change
- **WHEN** the operator activates a change-scoped command chip in a Dashboard Active Changes item
- **THEN** the system copies the command text for that change
- **AND** the current tab remains on Dashboard

#### Scenario: Dashboard next-step row background opens the change
- **WHEN** the operator clicks the `Next Step` row background or label area in a Dashboard Active Changes item
- **THEN** the current tab remains on Dashboard
- **AND** the command chips within that row remain directly interactive

#### Scenario: Dashboard primary change summary remains clickable
- **WHEN** the operator clicks the primary summary portion of a Dashboard Active Changes item, including its metadata/progress line
- **THEN** the corresponding change opens or focuses in the Main Viewer
- **AND** the `Next Step` row remains a separate non-navigating command region

#### Scenario: Show commands for an incomplete active change in ChangeViewer
- **WHEN** the operator opens an active change with incomplete tasks and the CLI-reported `workflows` list includes `apply` and `update`
- **THEN** the UI shows a `CommandChip` for `apply` inline in the header only if enabled
- **AND** shows `update` only if enabled

#### Scenario: Show update for a complete active change in ChangeViewer
- **WHEN** the operator opens an active change whose tasks are all complete and the CLI-reported `workflows` list includes `update`
- **THEN** the UI shows a `CommandChip` for `update` inline in the header only if enabled
- **AND** the `update` chip is labeled `Update`, matching the workflow command name `/opsx:update` (skill `openspec-update-change`)

#### Scenario: Show sync for an incomplete active change with spec deltas in ChangeViewer
- **WHEN** the operator opens an active change with incomplete tasks and one or more spec deltas
- **THEN** the UI shows a `CommandChip` for `sync` inline in the header only if enabled
- **AND** the `sync` command appears to the right of implementation-continuation commands in the command row

#### Scenario: Hide sync for an active change without spec deltas in ChangeViewer
- **WHEN** the operator opens an active change with no spec deltas
- **THEN** the UI does not show a `CommandChip` for `sync`

#### Scenario: Show commands for a complete active change in ChangeViewer
- **WHEN** the operator opens an active change whose tasks are all complete and that has one or more spec deltas
- **THEN** the UI shows enabled command chips ordered as `verify`, `update`, `sync`, `archive` inline in the header

#### Scenario: ChangeViewer header does not render suggestion actions
- **WHEN** the ChangeViewer header is rendered after suggestion feature removal
- **THEN** the header shows the command shortcut cluster without any Suggest / Exit button beside it

#### Scenario: Copy a change-scoped command with the change name only
- **WHEN** the operator activates a change-scoped command button with a single detected invocation form
- **THEN** the system copies the command plus the current change name
- **AND** does not append a task label

### Requirement: Exclude onboard from all command surfaces
The system SHALL NOT render, generate, or report the `onboard` command in any command chip, generated command text, command availability response, or command preference surface, even when the underlying CLI reports `onboard` as available.

#### Scenario: Onboard absent from generated commands and chips
- **WHEN** the operator invokes any command generation or command chip surface and the underlying CLI reports `onboard` as available
- **THEN** no generated command text or `CommandChip` references the `onboard` command

#### Scenario: Availability response filters onboard
- **WHEN** the server resolves the command availability for the active project
- **THEN** the availability response does not include the `onboard` command

### Requirement: Generate tool-identified invocation candidates
The system SHALL internally generate copyable command text from the official OpenSpec invocation forms: `/opsx:<id>`, `/opsx-<id>`, `@opsx-<id>`, `/openspec-<skill>`, `/skill:openspec-<skill>`, and `$openspec-<skill>`. Forms based on a workflow id SHALL interpolate the workflow id; forms based on a skill name SHALL interpolate the workflow's resolved skill name (for example `sync` → `openspec-sync-specs`). The system SHALL append no positional arguments for workspace-scoped commands and SHALL append `<change-name>` for change-scoped commands. User-facing copy choices SHALL be identified by tool name rather than by invocation-form id, prefix, or format name. When exactly one tool invocation is detected for the active repository, activating a copy control SHALL copy that tool's command directly. When multiple tool invocations are detected, activating a copy control SHALL open a `Choose tool` menu and SHALL copy only after the operator explicitly selects a tool. When no integration is detected, the menu SHALL offer the supported tool catalog by tool name. Undetected tools or a custom command SHALL be available through an `Other tool…` entry. Different tools SHALL remain separate choices even when they produce the same command string; only duplicate evidence for the same tool and form SHALL be collapsed. The system SHALL NOT auto-copy a previously used tool without confirmation and SHALL NOT fix a tool or form globally, per repository, or per command.

#### Scenario: Single detected tool copies directly
- **WHEN** exactly one tool invocation is detected for the active repository and the operator activates a workspace command button
- **THEN** the system copies the command text for that tool immediately

#### Scenario: Multiple detected tools require explicit selection
- **WHEN** multiple tool invocations are detected for the active repository and the operator activates a command button
- **THEN** the system opens a menu listing the detected tool names
- **AND** the system copies the command text only after the operator explicitly selects a tool

#### Scenario: No detected integration offers supported tools
- **WHEN** no integration is detected for the active repository and the operator activates a command button
- **THEN** the candidate menu offers supported tools by tool name

#### Scenario: Other tool is available for undetected tools
- **WHEN** the candidate menu is open and the desired tool was not detected
- **THEN** the menu includes an `Other tool…` entry through which the operator can select an undetected tool or enter a custom command

#### Scenario: Tools remain distinct when command strings match
- **WHEN** two or more detected tools produce the identical command string for a workflow (for example two tools using the `/opsx-<id>` form)
- **THEN** the candidate menu shows a separate tool-named entry for each tool
- **AND** duplicate evidence for the same tool and form is collapsed

#### Scenario: Skill-based forms interpolate the skill name
- **WHEN** the operator opens candidates for the `sync` workflow
- **THEN** the skill-based forms render `/openspec-sync-specs`, `/skill:openspec-sync-specs`, and `$openspec-sync-specs`
- **AND** the id-based forms render `/opsx:sync`, `/opsx-sync`, and `@opsx-sync`

#### Scenario: Change-scoped candidates append the change name
- **WHEN** the operator selects a candidate for a change-scoped command
- **THEN** the copied text appends the current change name

#### Scenario: No last-tool auto-copy
- **WHEN** the operator previously selected a tool from the candidate menu and later activates a command button with multiple detected tools
- **THEN** the system opens the candidate menu again and does not copy the previously used tool without confirmation

### Requirement: Centralize workflow metadata
The system SHALL maintain a single source of workflow metadata covering every workflow surfaced in command generation and Tools documentation, providing at minimum for each workflow its id, a user-facing label, a scope of `workspace` or `change`, and the OpenSpec skill name used by skill-based invocation forms (for example `apply` → `openspec-apply-change`, `sync` → `openspec-sync-specs`). The metadata SHALL include `update` with scope `change` and skill name `openspec-update-change`, SHALL NOT include `onboard`, SHALL NOT introduce a per-tool catalog, a generic adapter registry, an arguments schema, or a `multi-change` scope, and SHALL be the single source used to render workflow labels and skill-based invocation text.

#### Scenario: Workflow metadata is complete
- **WHEN** the system resolves metadata for each workflow surfaced in the UI
- **THEN** each workflow has an id, a user-facing label, a `workspace` or `change` scope, and a skill name

#### Scenario: Update is change-scoped with a skill name
- **WHEN** the system resolves metadata for the `update` workflow
- **THEN** the scope is `change`
- **AND** the skill name is `openspec-update-change`

#### Scenario: Workspace and change scope sets are fixed
- **WHEN** the system resolves workflow metadata for every surfaced workflow
- **THEN** `propose`, `explore`, `new`, and `bulk-archive` have scope `workspace`
- **AND** `apply`, `continue`, `ff`, `update`, `verify`, `sync`, and `archive` have scope `change`

#### Scenario: Onboard is absent from workflow metadata
- **WHEN** the system resolves workflow metadata
- **THEN** no `onboard` entry is present

#### Scenario: No multi-change scope exists
- **WHEN** the system resolves workflow metadata for `bulk-archive`
- **THEN** the scope is `workspace` rather than a `multi-change` scope

### Requirement: Resolve command availability from CLI workflows
The system SHALL treat the `workflows` list reported by the OpenSpec CLI/config for the active project as the single source of truth for command availability. A command SHALL be shown only when its workflow id is present in the reported `workflows` list and its visibility preference is enabled, and the system SHALL NOT use a core/expanded dichotomy to decide display. The command availability API SHALL add `delivery`, detected integrations, and invocation-form candidates for the active project, and SHALL retain the existing fields, marking `availableExpandedCommands` as deprecated. The system SHALL continue to exclude `onboard` from every command surface even when the underlying CLI reports `onboard` as available.

#### Scenario: Availability gates commands by the CLI workflows list
- **WHEN** the CLI reports `workflows` such as `["propose","explore","apply","sync","archive","verify"]` for the active project
- **THEN** command surfaces gate every workflow on membership in that list
- **AND** `update` and other absent workflow ids do not appear in any command surface

#### Scenario: Availability response carries delivery and detected forms
- **WHEN** the server resolves command availability for the active project
- **THEN** the response includes `delivery`, the detected integrations, and the detected invocation-form candidates
- **AND** the existing `availableExpandedCommands` field remains present but is marked as deprecated

#### Scenario: Onboard absent from generated commands and chips
- **WHEN** the operator invokes any command generation or command chip surface and the underlying CLI reports `onboard` as available
- **THEN** no generated command text or `CommandChip` references the `onboard` command

#### Scenario: Availability response filters onboard
- **WHEN** the server resolves the command availability for the active project
- **THEN** the availability response does not include the `onboard` command
