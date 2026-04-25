# project-selector-ui Specification

## Purpose
Define project selection, project creation, and empty-state behavior for the active-project UI.

## Requirements
### Requirement: Project selector dialog
The web UI SHALL render a ProjectSelector dialog component when `layoutStore.overlay` is set to `'project-selector'`. The dialog SHALL display a list of registered projects with their labels, an `Add New Project` action that opens a dedicated add-project dialog, and a remove action for each project. The currently active project SHALL be visually distinguished. Selecting a project SHALL switch the active project via WebSocket `project:bind` message and close the dialog.

#### Scenario: Open project selector
- **WHEN** the operator clicks the `folder-pen` button in the Dashboard header or the ExplorerPane footer
- **THEN** the ProjectSelector dialog opens
- **AND** displays all registered projects
- **AND** the active project is visually distinguished

#### Scenario: Open add-project dialog from selector
- **WHEN** the operator clicks the `Add New Project` action in the ProjectSelector dialog
- **THEN** the ProjectSelector dialog closes
- **AND** the dedicated add-project dialog opens

#### Scenario: Switch project via selector
- **WHEN** the operator clicks a non-active project in the ProjectSelector
- **THEN** a WebSocket `project:bind` message is sent with the target project ID
- **AND** the dialog closes
- **AND** all frontend stores are reset and re-fetched via the `project:bound` response
- **AND** all open tabs are closed and the Dashboard tab is focused

### Requirement: Add-project dialog
The web UI SHALL render a dedicated AddProjectDialog component when `layoutStore.overlay` is set to `'add-project'`. The dialog SHALL prioritize directory browsing, SHALL show which subdirectories contain an `openspec/` folder, and SHALL provide a manual path fallback. Selecting the current directory or submitting a manual path SHALL add and activate that project. After the API add or reactivate step completes, the client SHALL complete a WebSocket `project:bind` flow for the returned project before treating that project as ready. The manual path fallback SHALL accept any non-empty string without absolute-path validation; the server validates the path.

#### Scenario: Open add-project dialog from empty state
- **WHEN** the operator clicks the primary add-project action from the empty project state
- **THEN** the dedicated add-project dialog opens
- **AND** a directory browser is shown immediately

#### Scenario: Browse and add current directory
- **WHEN** the operator navigates directories in the add-project dialog and chooses the currently displayed directory
- **THEN** a POST request is sent to `/api/projects`
- **AND** the client sends WebSocket `project:bind` for the returned project id
- **AND** the selected directory becomes the active project after the `project:bound` response has reinitialized project-scoped data
- **AND** the add-project dialog closes

#### Scenario: Manual path fallback
- **WHEN** the operator expands the manual path section in the add-project dialog and submits a path
- **THEN** a POST request is sent to `/api/projects`
- **AND** the client sends WebSocket `project:bind` for the returned project id
- **AND** the selected directory becomes the active project after the `project:bound` response has reinitialized project-scoped data
- **AND** the add-project dialog closes

### Requirement: Empty state when no projects
The web UI SHALL display an empty state view in the Main Viewer when no projects are registered. The empty state SHALL include a message indicating no projects are loaded and a button to open the add-project dialog. The empty state SHALL NOT show the Explorer Pane or Dashboard content.

#### Scenario: First startup with no projects
- **WHEN** the application loads and the project registry is empty
- **THEN** the Main Viewer shows an empty state with a message and an add-project button
- **AND** the Explorer Pane is hidden

#### Scenario: Remove last project
- **WHEN** the operator removes the only registered project
- **THEN** the Main Viewer transitions to the empty state
- **AND** the Explorer Pane is hidden

### Requirement: Project switch loading state
The web UI SHALL display a loading indicator during project switching. The loading indicator SHALL appear immediately when the operator selects a different project or adds/reactivates a project and SHALL disappear only after the new project's data has been fully loaded from the `project:bound`-triggered refresh.

#### Scenario: Loading during switch
- **WHEN** the operator switches to a different project
- **THEN** a loading indicator is shown
- **AND** the indicator disappears when the new project data is loaded

#### Scenario: Loading during initial add
- **WHEN** the operator adds a new project (which becomes active)
- **THEN** a loading indicator is shown during parsing and binding
- **AND** the indicator disappears when the project data is loaded
