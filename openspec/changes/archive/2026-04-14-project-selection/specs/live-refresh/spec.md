## MODIFIED Requirements

### Requirement: Watch relevant OpenSpec files and directories
The system SHALL watch only the active OpenSpec project directory for markdown file changes, SHALL ignore dotfiles and `node_modules`, SHALL classify relevant updates as affecting `project`, `specs`, or `changes`, and SHALL replace the watcher when the active project changes.

#### Scenario: Replace the watcher on project switch
- **WHEN** the active project changes
- **THEN** the previous active project's watcher is closed
- **AND** a watcher is started for the new active project only

### Requirement: Reparse and broadcast refresh events
On every relevant watcher event for the active project, the system SHALL reparse the full active workspace, SHALL retain the fresh in-memory data set when parsing succeeds, and SHALL broadcast a `data:refresh` websocket message that identifies the affected entity and entity ID. When the active project changes, the system SHALL broadcast a `project:switched` websocket message containing the new active project id, or `null` when no active project remains. When a websocket client connects or reconnects, the system SHALL send a `connection:init` websocket message containing the current active project id.

#### Scenario: Broadcast project switch
- **WHEN** the active project changes
- **THEN** the system broadcasts a `project:switched` websocket event with the new active project id

#### Scenario: Broadcast removal of the last project
- **WHEN** the active project becomes empty after removing the last registered project
- **THEN** the system broadcasts a `project:switched` websocket event with `projectId: null`

#### Scenario: Send active project on websocket connect
- **WHEN** a websocket client connects
- **THEN** the system sends a `connection:init` websocket event containing the current `activeProjectId`

### Requirement: Hot-refresh the browser without losing context
The browser client SHALL refetch active-project data over HTTP after a `project:switched` message, SHALL reset project-scoped state such as open tabs and search context, SHALL refresh command availability for the new active project, SHALL reconcile its state against `connection:init` after websocket connect or reconnect, and SHALL continue using `data:refresh` for in-project file updates.

#### Scenario: Reset project-scoped UI after a project switch
- **WHEN** the browser client receives a `project:switched` websocket message
- **THEN** it reloads the active project data
- **AND** closes project-specific tabs so the Dashboard becomes the focused tab
- **AND** refreshes command availability for the new active project

#### Scenario: Reconcile project context after websocket reconnect
- **WHEN** the browser client reconnects and receives `connection:init`
- **AND** the announced `activeProjectId` differs from the client's current project context
- **THEN** it reinitializes project-scoped state before applying later refresh messages
