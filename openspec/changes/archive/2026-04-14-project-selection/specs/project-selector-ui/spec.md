## ADDED Requirements

### Requirement: Project selector dialog
The web UI SHALL render a ProjectSelector dialog component when `layoutStore.overlay` is set to `'project-selector'`. The dialog SHALL display a list of registered projects with their labels, a text input for adding a new project by path, and a remove action for each project. The currently active project SHALL be visually distinguished. Selecting a project SHALL switch the active project via API and close the dialog.

#### Scenario: Open project selector
- **WHEN** the operator clicks the project control button in the ActivityBar
- **THEN** the ProjectSelector dialog opens
- **AND** displays all registered projects
- **AND** the active project is visually distinguished

#### Scenario: Switch project via selector
- **WHEN** the operator clicks a non-active project in the ProjectSelector
- **THEN** a POST request is sent to `/api/projects/:id/activate`
- **AND** the dialog closes
- **AND** all frontend stores are reset and re-fetched
- **AND** all open tabs are closed and the Dashboard tab is focused

#### Scenario: Add project via selector
- **WHEN** the operator types a valid path into the text input and submits
- **THEN** a POST request is sent to `/api/projects` with the path
- **AND** the project appears in the selector list
- **AND** the new project becomes active

#### Scenario: Add invalid path via selector
- **WHEN** the operator types a path that is not a valid OpenSpec project and submits
- **THEN** an error message is displayed inline in the dialog
- **AND** the dialog remains open

#### Scenario: Remove project via selector
- **WHEN** the operator activates the remove action on a project entry
- **THEN** a confirmation is requested
- **AND** upon confirmation, a DELETE request is sent to `/api/projects/:id`
- **AND** the project is removed from the list
- **AND** if the removed project was active, the next project becomes active

### Requirement: Empty state when no projects
The web UI SHALL display an empty state view in the Main Viewer when no projects are registered. The empty state SHALL include a message indicating no projects are loaded and a path input to add the first project. The empty state SHALL NOT show the Explorer Pane or Dashboard content.

#### Scenario: First startup with no projects
- **WHEN** the application loads and the project registry is empty
- **THEN** the Main Viewer shows an empty state with a message and a path input
- **AND** the Explorer Pane is hidden

#### Scenario: Remove last project
- **WHEN** the operator removes the only registered project
- **THEN** the Main Viewer transitions to the empty state
- **AND** the Explorer Pane is hidden

### Requirement: Project switch loading state
The web UI SHALL display a loading indicator during project switching. The loading indicator SHALL appear immediately when the operator selects a different project and SHALL disappear once the new project data is fully loaded.

#### Scenario: Loading during switch
- **WHEN** the operator switches to a different project
- **THEN** a loading indicator is shown
- **AND** the indicator disappears when the new project data is loaded

#### Scenario: Loading during initial add
- **WHEN** the operator adds a new project (which becomes active)
- **THEN** a loading indicator is shown during parsing
- **AND** the indicator disappears when the project data is loaded
