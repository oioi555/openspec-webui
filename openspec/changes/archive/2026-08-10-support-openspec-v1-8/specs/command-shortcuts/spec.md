## MODIFIED Requirements

### Requirement: Show workspace command buttons on Dashboard and Changes
The system SHALL render copy-command buttons inline within the ACTIVE CHANGES section header surface using the `CommandChip` component from `$lib/components/shared/command-chip/`, whether that surface is shown in the persistent Explorer Pane or the temporary narrow-width Home drawer. The system SHALL include `propose`, `explore`, and `update` only when those core commands are enabled via visibility settings, SHALL include `new` only when that expanded command is both available and enabled, SHALL include `bulk-archive` only when at least one active change is fully complete and that expanded command is both available and enabled, SHALL include `continue` and `ff` only when at least one active change remains incomplete and those expanded commands are both available and enabled, and SHALL NOT include `onboard` in the workspace command row. The row SHALL remain compact, SHALL wrap when many commands are visible, and SHALL preserve command-emphasis styling distinct from standard action buttons.

#### Scenario: Show enabled workspace commands on Home
- **WHEN** the operator views the Home surface
- **THEN** the UI shows `CommandChip` controls for `propose`, `explore`, and `update` only if those commands are enabled via visibility settings

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

#### Scenario: Hide onboard from the workspace command row
- **WHEN** the workspace command row is rendered
- **THEN** no `CommandChip` or generated command text for `onboard` is shown

## ADDED Requirements

### Requirement: Exclude onboard from all command surfaces
The system SHALL NOT render, generate, or report the `onboard` command in any command chip, generated command text, command availability response, or command preference surface, even when the underlying CLI reports `onboard` as available.

#### Scenario: Onboard absent from generated commands and chips
- **WHEN** the operator invokes any command generation or command chip surface and the underlying CLI reports `onboard` as available
- **THEN** no generated command text or `CommandChip` references the `onboard` command

#### Scenario: Availability response filters onboard
- **WHEN** the server resolves the command availability for the active project
- **THEN** the availability response does not include the `onboard` command
