# command-shortcuts Specification

## Purpose
Generates and surfaces copyable OpenSpec commands in the web UI using the operator's preferred AI tool syntax, with visibility rules that adapt to workspace state and change completion status.
## Requirements
### Requirement: Generate command text from the active syntax preference
The system SHALL generate OpenSpec commands with `/opsx-<workflow>` when the AI tool preference is `default`, SHALL generate OpenSpec commands with `/opsx:<workflow>` when the AI tool preference is `Claude Code`, SHALL append no positional arguments for workspace-scoped commands, and SHALL append `<change-name>` only for change-scoped commands.

#### Scenario: Generate a workspace command with the default syntax
- **WHEN** the operator uses a workspace-scoped command while the AI tool preference is `default`
- **THEN** the system generates a command such as `/opsx-propose`
- **AND** does not append a change argument

#### Scenario: Generate a change-scoped command with the Claude Code syntax
- **WHEN** the operator uses a change-scoped command while the AI tool preference is `Claude Code`
- **THEN** the system generates a command such as `/opsx:apply <change-name>`
- **AND** does not append a task label or other extra argument

### Requirement: Show workspace command buttons on Dashboard and Changes
The system SHALL render copy-command buttons inline within the ACTIVE CHANGES section header of the `Home -> ACTIVE CHANGES` surface, whether that surface is shown in the persistent Explorer Pane or the temporary narrow-width Home drawer. The system SHALL always include the core workspace commands `propose` and `explore`, SHALL include `new` only when that expanded command is both available and enabled, SHALL include `bulk-archive` only when at least one active change is fully complete and that expanded command is both available and enabled, and SHALL include `continue` and `ff` only when at least one active change remains incomplete and those expanded commands are both available and enabled. The command buttons SHALL be rendered as a compact button row without a surrounding card, title, or description block.

#### Scenario: Show the always-available workspace commands on Home
- **WHEN** the operator views the Home surface
- **THEN** the UI shows copy buttons for `propose` and `explore` inline in the ACTIVE CHANGES section header

#### Scenario: Show incomplete-work workspace commands
- **WHEN** at least one active change still has incomplete tasks
- **THEN** the UI shows copy buttons for `continue` and `ff` only if those commands are available and enabled

#### Scenario: Show bulk archive when completed active changes exist
- **WHEN** at least one active change is fully complete
- **THEN** the UI shows a copy button for `bulk-archive` only if that command is available and enabled

#### Scenario: Copy a workspace command without arguments
- **WHEN** the operator activates a workspace command button
- **THEN** the system copies only the command text
- **AND** does not append a change name

#### Scenario: Show workspace commands in narrow-width home drawer
- **WHEN** the viewport width is less than 768px and the operator opens the Home drawer
- **THEN** the ACTIVE CHANGES section header in that drawer shows the same workspace command buttons as the persistent Explorer Pane

### Requirement: Show change-scoped command buttons in ChangeViewer
The system SHALL render change-scoped copy-command buttons inline within the ChangeViewer header alongside existing actions, SHALL show `apply` when the change still has incomplete tasks, SHALL show `archive` when the change has no incomplete tasks, SHALL show `continue` and `ff` for incomplete changes only when those commands are both available and enabled, and SHALL show `verify` and `sync` for complete changes only when those commands are both available and enabled. The command buttons SHALL be rendered as a compact button row without a surrounding card, title, or description block.

#### Scenario: Show commands for an incomplete active change
- **WHEN** the operator opens an active change with incomplete tasks
- **THEN** the UI shows a copy button for `apply` inline in the header
- **AND** shows `continue` and `ff` only if those commands are available and enabled

#### Scenario: Show commands for a complete active change
- **WHEN** the operator opens an active change whose tasks are all complete
- **THEN** the UI shows a copy button for `archive` inline in the header
- **AND** shows `verify` and `sync` only if those commands are available and enabled

#### Scenario: Copy a change-scoped command with the change name only
- **WHEN** the operator activates a change-scoped command button
- **THEN** the system copies the command plus the current change name
- **AND** does not append a task label

#### Scenario: Hide change-scoped commands for archived changes
- **WHEN** the operator opens an archived change
- **THEN** the UI does not show change-scoped copy-command buttons
