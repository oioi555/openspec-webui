# command-shortcuts Specification

## Purpose
Generates and surfaces copyable OpenSpec commands in the web UI using the operator's preferred AI tool syntax, with visibility rules that adapt to workspace state and change completion status.
## Requirements
### Requirement: Generate command text from the active syntax preference
The system SHALL generate OpenSpec commands with `/opsx-<workflow>` when the AI tool preference is `standard`, SHALL generate OpenSpec commands with `/opsx:<workflow>` when the AI tool preference is `Claude Code`, SHALL generate OpenSpec commands with `/openspec-<workflow>` when the AI tool preference is `skill`, SHALL append no positional arguments for workspace-scoped commands, and SHALL append `<change-name>` only for change-scoped commands.

#### Scenario: Generate a workspace command with the standard syntax
- **WHEN** the operator uses a workspace-scoped command while the AI tool preference is `standard`
- **THEN** the system generates a command such as `/opsx-propose`
- **AND** does not append a change argument

#### Scenario: Generate a change-scoped command with the Claude Code syntax
- **WHEN** the operator uses a change-scoped command while the AI tool preference is `Claude Code`
- **THEN** the system generates a command such as `/opsx:apply <change-name>`
- **AND** does not append a task label or other extra argument

#### Scenario: Generate a workspace command with the skill syntax
- **WHEN** the operator uses a workspace-scoped command while the AI tool preference is `skill`
- **THEN** the system generates a command such as `/openspec-propose`
- **AND** does not append a change argument

### Requirement: Show workspace command buttons on Dashboard and Changes
The system SHALL render copy-command buttons inline within the ACTIVE CHANGES section header surface using the `CommandChip` component from `$lib/components/shared/command-chip/`, whether that surface is shown in the persistent Explorer Pane or the temporary narrow-width Home drawer. The system SHALL include `propose` and `explore` only when those core commands are enabled via visibility settings, SHALL include `new` only when that expanded command is both available and enabled, SHALL include `bulk-archive` only when at least one active change is fully complete and that expanded command is both available and enabled, and SHALL include `continue` and `ff` only when at least one active change remains incomplete and those expanded commands are both available and enabled. The row SHALL remain compact, SHALL wrap when many commands are visible, and SHALL preserve command-emphasis styling distinct from standard action buttons.

#### Scenario: Show enabled workspace commands on Home
- **WHEN** the operator views the Home surface
- **THEN** the UI shows `CommandChip` controls for `propose` and `explore` only if those commands are enabled via visibility settings

#### Scenario: Show incomplete-work workspace commands
- **WHEN** at least one active change still has incomplete tasks
- **THEN** the UI shows `CommandChip` controls for `continue` and `ff` only if those commands are available and enabled

#### Scenario: Show bulk archive when completed active changes exist
- **WHEN** at least one active change is fully complete
- **THEN** the UI shows a `CommandChip` for `bulk-archive` only if that command is available and enabled

#### Scenario: Wrap a dense workspace command row
- **WHEN** multiple workspace commands are simultaneously visible
- **THEN** the command row wraps across lines with compact spacing
- **AND** the chips remain visually grouped apart from surrounding title / count UI

#### Scenario: Copy a workspace command without arguments
- **WHEN** the operator activates a workspace command button
- **THEN** the system copies only the command text
- **AND** does not append a change name

#### Scenario: Show workspace commands in narrow-width home drawer
- **WHEN** the viewport width is less than 768px and the operator opens the Home drawer
- **THEN** the ACTIVE CHANGES section header in that drawer shows the same `CommandChip` controls as the persistent Explorer Pane

### Requirement: Show change-scoped command buttons in ChangeViewer
The system SHALL render change-scoped copy-command buttons inline within the ChangeViewer header using `CommandChip` components. The system SHALL also render change-scoped copy-command buttons within each Dashboard Active Changes list item using `CommandChip` components via `CommandShortcutBar`. The system SHALL show `apply` only when the change still has incomplete tasks and the command is enabled, SHALL show `archive` only when the change has no incomplete tasks and the command is enabled, SHALL show `continue` and `ff` for incomplete changes only when those commands are both available and enabled, and SHALL show `verify` and `sync` for complete changes only when those commands are both available and enabled. In Dashboard list items, the command chips SHALL be visually separated from the primary open-change action, SHALL be preceded by a `Next Step` cue label, and activating a command chip SHALL NOT trigger navigation into the change.

#### Scenario: Show commands for an incomplete active change in Dashboard
- **WHEN** the Dashboard surface renders an active change with incomplete tasks
- **THEN** that change item shows a `CommandChip` for `apply` only if enabled
- **AND** shows `continue` and `ff` only if those commands are available and enabled

#### Scenario: Show commands for a complete active change in Dashboard
- **WHEN** the Dashboard surface renders an active change whose tasks are all complete
- **THEN** that change item shows a `CommandChip` for `archive` only if enabled
- **AND** shows `verify` and `sync` only if those commands are available and enabled

#### Scenario: Dashboard command row shows next-step cue
- **WHEN** the Dashboard renders change-scoped command chips for an active change
- **THEN** the command row shows a `Next Step` label before the command chips
- **AND** the cue remains visible even if only one command chip is shown

#### Scenario: Dashboard command chips do not open the change
- **WHEN** the operator activates a change-scoped command chip in a Dashboard Active Changes item
- **THEN** the system copies the command text for that change
- **AND** the current tab remains on Dashboard

#### Scenario: Show commands for an incomplete active change in ChangeViewer
- **WHEN** the operator opens an active change with incomplete tasks
- **THEN** the UI shows a `CommandChip` for `apply` inline in the header only if enabled
- **AND** shows `continue` and `ff` only if those commands are available and enabled

#### Scenario: Show commands for a complete active change in ChangeViewer
- **WHEN** the operator opens an active change whose tasks are all complete
- **THEN** the UI shows a `CommandChip` for `archive` inline in the header only if enabled
- **AND** shows `verify` and `sync` only if those commands are available and enabled

#### Scenario: ChangeViewer header does not render suggestion actions
- **WHEN** the ChangeViewer header is rendered after suggestion feature removal
- **THEN** the header shows the command shortcut cluster without any Suggest / Exit button beside it

#### Scenario: Copy a change-scoped command with the change name only
- **WHEN** the operator activates a change-scoped command button
- **THEN** the system copies the command plus the current change name
- **AND** does not append a task label
