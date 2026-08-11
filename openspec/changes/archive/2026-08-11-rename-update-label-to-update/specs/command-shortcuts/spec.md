## MODIFIED Requirements

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

