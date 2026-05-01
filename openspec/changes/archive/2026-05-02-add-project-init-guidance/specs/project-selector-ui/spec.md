## MODIFIED Requirements

### Requirement: Add-project dialog
The web UI SHALL render a dedicated AddProjectDialog component when `layoutStore.overlay` is set to `'add-project'`. The dialog SHALL prioritize directory browsing, SHALL show which subdirectories contain an `openspec/` folder, SHALL provide a manual path fallback, and SHALL show a concise initialization hint that points to OpenSpec installation and `openspec init` setup documentation. Selecting the current directory or submitting a manual path SHALL add and activate that project. After the API add or reactivate step completes, the client SHALL complete a WebSocket `project:bind` flow for the returned project before treating that project as ready. The manual path fallback SHALL accept any non-empty string without absolute-path validation; the server validates the path.

#### Scenario: Open add-project dialog from empty state
- **WHEN** the operator clicks the primary add-project action from the empty project state
- **THEN** the dedicated add-project dialog opens
- **AND** a directory browser is shown immediately
- **AND** the dialog shows a concise initialization hint with links to setup documentation

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

#### Scenario: Explain missing initialization in AddProjectDialog
- **WHEN** the operator opens the add-project dialog for a directory that does not contain an `openspec/` folder
- **THEN** the dialog explains that the repository must be initialized with `openspec init`
- **AND** the dialog provides a link to the setup documentation

### Requirement: Empty state when no projects
The web UI SHALL display an empty state view in the Main Viewer when no projects are registered. The empty state SHALL explain that OpenSpec must be installed and the target repository must be initialized with `openspec init` before it can be added, SHALL include links to OpenSpec installation and setup documentation, and SHALL provide a button to open the add-project dialog. The empty state SHALL NOT show the Explorer Pane or Dashboard content.

#### Scenario: First startup with no projects
- **WHEN** the application loads and the project registry is empty
- **THEN** the Main Viewer shows an empty state with onboarding guidance, setup links, and an add-project button
- **AND** the Explorer Pane is hidden

#### Scenario: Open setup docs from empty state
- **WHEN** the operator clicks a setup documentation link in the empty state
- **THEN** the browser opens the OpenSpec setup documentation

#### Scenario: Reuse shared OpenSpec docs links in onboarding surfaces
- **WHEN** the empty state or add-project dialog renders OpenSpec documentation links
- **THEN** both surfaces reuse the same shared OpenSpec docs URL constants
- **AND** the install link points to the OpenSpec installation docs
- **AND** the setup link points to the OpenSpec CLI setup docs

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
