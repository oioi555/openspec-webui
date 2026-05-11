## MODIFIED Requirements

### Requirement: Show change-scoped command buttons in ChangeViewer
The system SHALL render change-scoped copy-command buttons inline within the ChangeViewer header using `CommandChip` components. The system SHALL also render change-scoped copy-command buttons within each Dashboard Active Changes list item using `CommandChip` components via `CommandShortcutBar`. The system SHALL show `apply` only when the change still has incomplete tasks and the command is enabled, SHALL show `archive` only when the change has no incomplete tasks and the command is enabled, SHALL show `continue` and `ff` for incomplete changes only when those commands are both available and enabled, and SHALL show `verify` and `sync` for complete changes only when those commands are both available and enabled. In Dashboard list items, the command chips SHALL be visually separated from the primary open-change action, SHALL be preceded by a `Next Step` cue label, activating a command chip SHALL NOT trigger navigation into the change, and the primary open-change action SHALL remain clickable across the full card surface, including the lower metadata/progress line and the `Next Step` row background and label area.

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

#### Scenario: Dashboard next-step row background opens the change
- **WHEN** the operator clicks the `Next Step` row background or label area in a Dashboard Active Changes item
- **THEN** the corresponding change opens or focuses in the Main Viewer
- **AND** the command chips within that row remain separately interactive

#### Scenario: Dashboard primary change summary remains clickable
- **WHEN** the operator clicks anywhere in the non-command portion of a Dashboard Active Changes item, including the lower metadata/progress line and the `Next Step` row background
- **THEN** the corresponding change opens or focuses in the Main Viewer
- **AND** the command chips remain a separate non-navigating interaction region
