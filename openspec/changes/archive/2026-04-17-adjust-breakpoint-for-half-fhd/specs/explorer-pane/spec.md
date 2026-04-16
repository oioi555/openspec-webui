## MODIFIED Requirements

### Requirement: Explorer Pane renders current-project header content
When the Explorer Pane is visible, the system SHALL render current-project header content within the pane header itself. The header SHALL display a folder icon, SHALL display the active project name, and SHALL provide a `folder-pen` button that opens the project selector. The header SHALL NOT render a project avatar or project appearance editor affordance. In narrow layout, the drawer SHALL open to the right of the Activity Bar so the rail remains visible.

#### Scenario: Explorer Pane shows project header content
- **WHEN** the Explorer Pane is visible with an active project
- **THEN** the top row of the pane displays a folder icon and the active project name together
- **AND** the row includes a `folder-pen` project selector button

#### Scenario: ExplorerPane selector button opens selector
- **WHEN** the operator activates the `folder-pen` button in the current-project header
- **THEN** the project selector opens
- **AND** the collapse state of the Explorer Pane does not change

#### Scenario: Narrow drawer keeps the Activity Bar visible
- **WHEN** the application is in narrow layout (viewport width 960px or less) and the operator opens the Explorer drawer
- **THEN** the drawer appears to the right of the 48px Activity Bar
- **AND** the Activity Bar remains visible and interactive
