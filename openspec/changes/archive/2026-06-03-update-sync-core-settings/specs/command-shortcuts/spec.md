## MODIFIED Requirements

### Requirement: Show change-scoped command buttons in ChangeViewer
The system SHALL render change-scoped copy-command buttons inline within the ChangeViewer header using `CommandChip` components. The system SHALL also render change-scoped copy-command buttons within each Dashboard Active Changes list item using `CommandChip` components via `CommandShortcutBar`. The system SHALL show `apply` only when the change still has incomplete tasks and the command is enabled, SHALL show `continue` and `ff` for incomplete changes only when those commands are enabled, and SHALL show `sync` for any active, unarchived change that has one or more spec deltas and the command is enabled, regardless of task completion status. The system SHALL show `verify` only when the change has no incomplete tasks and the command is enabled, and SHALL show `archive` only when the change has no incomplete tasks and the command is enabled. Change-scoped command chips SHALL be ordered left-to-right by workflow stage so later-stage actions appear farther right; incomplete changes SHALL order implementation-continuation commands before `sync`, and completed changes SHALL order commands as `verify`, `sync`, `archive`. In Dashboard list items, the command chips SHALL be visually separated from the primary open-change action, SHALL be preceded by a `Next Step` cue label, activating a command chip SHALL NOT trigger navigation into the change, and the primary open-change action SHALL remain clickable across the full card surface, including the lower metadata/progress line and the `Next Step` row background and label area.

#### Scenario: Show commands for an incomplete active change in Dashboard
- **WHEN** the Dashboard surface renders an active change with incomplete tasks
- **THEN** that change item shows a `CommandChip` for `apply` only if enabled
- **AND** shows `continue` and `ff` only if those commands are enabled

#### Scenario: Show sync for an incomplete active change with spec deltas in Dashboard
- **WHEN** the Dashboard surface renders an active change with incomplete tasks and one or more spec deltas
- **THEN** that change item shows a `CommandChip` for `sync` only if enabled
- **AND** the `sync` command appears to the right of implementation-continuation commands in the command row

#### Scenario: Hide sync for an incomplete active change without spec deltas in Dashboard
- **WHEN** the Dashboard surface renders an active change with incomplete tasks and no spec deltas
- **THEN** that change item does not show a `CommandChip` for `sync`

#### Scenario: Show commands for a complete active change in Dashboard
- **WHEN** the Dashboard surface renders an active change whose tasks are all complete and that has one or more spec deltas
- **THEN** that change item shows `CommandChip` controls ordered as `verify`, `sync`, `archive` for the enabled commands

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

#### Scenario: Show commands for an incomplete active change in ChangeViewer
- **WHEN** the operator opens an active change with incomplete tasks
- **THEN** the UI shows a `CommandChip` for `apply` inline in the header only if enabled
- **AND** shows `continue` and `ff` only if those commands are enabled

#### Scenario: Show sync for an incomplete active change with spec deltas in ChangeViewer
- **WHEN** the operator opens an active change with incomplete tasks and one or more spec deltas
- **THEN** the UI shows a `CommandChip` for `sync` inline in the header only if enabled
- **AND** the `sync` command appears to the right of implementation-continuation commands in the command row

#### Scenario: Hide sync for an active change without spec deltas in ChangeViewer
- **WHEN** the operator opens an active change with no spec deltas
- **THEN** the UI does not show a `CommandChip` for `sync`

#### Scenario: Show commands for a complete active change in ChangeViewer
- **WHEN** the operator opens an active change whose tasks are all complete and that has one or more spec deltas
- **THEN** the UI shows enabled command chips ordered as `verify`, `sync`, `archive` inline in the header

#### Scenario: ChangeViewer header does not render suggestion actions
- **WHEN** the ChangeViewer header is rendered after suggestion feature removal
- **THEN** the header shows the command shortcut cluster without any Suggest / Exit button beside it

#### Scenario: Copy a change-scoped command with the change name only
- **WHEN** the operator activates a change-scoped command button
- **THEN** the system copies the command plus the current change name
- **AND** does not append a task label
