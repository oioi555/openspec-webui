## MODIFIED Requirements

### Requirement: Show workspace command buttons on Dashboard and Changes
The system SHALL render copy-command buttons inline within the ACTIVE CHANGES section header surface using the `CommandChip` component from `$lib/components/ui/command-chip/`. The row SHALL remain compact, SHALL wrap when many commands are visible, and SHALL preserve command-emphasis styling distinct from standard action buttons.

#### Scenario: Show the always-available workspace commands on Home
- **WHEN** the operator views the Home surface
- **THEN** the UI shows `CommandChip` controls for `propose` and `explore` inline in the ACTIVE CHANGES command row

#### Scenario: Wrap a dense workspace command row
- **WHEN** multiple workspace commands are simultaneously visible
- **THEN** the command row wraps across lines with compact spacing
- **AND** the chips remain visually grouped apart from surrounding title / count UI

### Requirement: Show change-scoped command buttons in ChangeViewer
The system SHALL render change-scoped copy-command buttons inline within the ChangeViewer header using `CommandChip` components. When the header also contains a standard action button such as the Suggest / Exit toggle, the command chips SHALL remain a separate compact cluster rather than adopting the same size and styling as the standard action button.

#### Scenario: Show commands for an incomplete active change
- **WHEN** the operator opens an active change with incomplete tasks
- **THEN** the UI shows a `CommandChip` for `apply` inline in the header
- **AND** shows `continue` and `ff` only if those commands are available and enabled

#### Scenario: Show commands for a complete active change
- **WHEN** the operator opens an active change whose tasks are all complete
- **THEN** the UI shows a `CommandChip` for `archive` inline in the header
- **AND** shows `verify` and `sync` only if those commands are available and enabled

#### Scenario: Separate command chips from standard actions
- **WHEN** the ChangeViewer header renders both command shortcuts and the Suggest / Exit action
- **THEN** the command shortcuts are shown as a compact `CommandChip` cluster
- **AND** the Suggest / Exit action remains a standard `<Button>` control
