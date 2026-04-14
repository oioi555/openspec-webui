## MODIFIED Requirements

### Requirement: Watch relevant OpenSpec files and directories
The system SHALL watch the OpenSpec project directory for each active session's project. Each session SHALL have its own independent chokidar watcher. The system SHALL ignore dotfiles and `node_modules` for all watchers. Each watcher SHALL classify relevant updates as affecting `project`, `specs`, or `changes`. Watchers SHALL be created on session activation and closed when the session's reference count reaches zero.

#### Scenario: Ignore unsupported file changes
- **WHEN** a file event occurs for a non-markdown file in any watched project
- **THEN** the corresponding watcher ignores the event

#### Scenario: Classify a spec file change
- **WHEN** a file event occurs under `specs/<capability>/` in a watched project
- **THEN** the system classifies the update as affecting `specs`
- **AND** uses the capability directory name as the affected entity ID

#### Scenario: Classify a change directory event
- **WHEN** a directory is added or removed under `changes/` or `changes/archive/` in a watched project
- **THEN** the system classifies the update as affecting `changes`

#### Scenario: Multiple watchers for multiple active projects
- **WHEN** project A and project B both have active sessions with bound clients
- **THEN** both projects have independent chokidar watchers running simultaneously
- **AND** file changes in project A do not trigger events for project B's clients

### Requirement: Reparse and broadcast refresh events
On every relevant watcher event for an active session's project, the system SHALL reparse that project's full workspace, SHALL retain the fresh in-memory data set when parsing succeeds, and SHALL route a `data:refresh` WebSocket message only to clients bound to that project. The message SHALL identify the affected entity and entity ID. When a client binds to a project via `project:bind`, the system SHALL send a `project:bound` WebSocket message containing the new project ID and current data to the requesting client only. When a WebSocket client connects or reconnects, the system SHALL send a `connection:init` WebSocket message containing the client's bound project ID.

#### Scenario: Broadcast a change refresh after a markdown edit
- **WHEN** a markdown file changes inside a change directory in project A
- **THEN** the system reparses project A's workspace
- **AND** sends a `data:refresh` event for the `changes` entity only to clients bound to project A

#### Scenario: Keep prior data on failed reparses
- **WHEN** a watcher-triggered reparse fails for a project
- **THEN** the system does not replace the previously loaded in-memory data for that project

#### Scenario: Client switches project via bind message
- **WHEN** a client sends a `project:bind` WebSocket message with a valid project ID
- **THEN** the system sends a `project:bound` event to that client only with the new project ID and data
- **AND** other clients are unaffected

#### Scenario: Send bound project on websocket connect
- **WHEN** a websocket client connects
- **THEN** the system sends a `connection:init` websocket event containing the client's bound `activeProjectId`

### Requirement: Hot-refresh the browser without losing context
The browser client SHALL handle `data:refresh` events only for its currently bound project. When the client receives a `project:bound` event, it SHALL reload all project-scoped data, reset project-scoped state such as open tabs and search context, and refresh command availability for the new project. When the client receives a `connection:init` on reconnect, it SHALL reconcile its state. The client SHALL use `data:refresh` for in-project file updates without full reloads.

#### Scenario: Refresh a spec detail view in place
- **WHEN** a websocket refresh targets specs in the client's bound project while a spec detail view is open
- **THEN** the client reloads the spec data
- **AND** keeps the current detail view active without showing the initial loading state again

#### Scenario: Refresh a change detail view in place
- **WHEN** a websocket refresh targets changes in the client's bound project while a change detail view is open
- **THEN** the client reloads the change data
- **AND** preserves the selected change tab and file selection when those indices still exist

#### Scenario: Show an update notification
- **WHEN** a websocket refresh targets a specific entity instead of `all` in the client's bound project
- **THEN** the client shows a toast identifying the updated entity or item

#### Scenario: Handle project:bound event
- **WHEN** the browser client receives a `project:bound` websocket message
- **THEN** it reloads the bound project data
- **AND** closes project-specific tabs so the Dashboard becomes the focused tab
- **AND** refreshes command availability for the new project

#### Scenario: Reconcile project context after websocket reconnect
- **WHEN** the browser client reconnects and receives `connection:init`
- **AND** the announced `activeProjectId` differs from the client's current project context
- **THEN** it reinitializes project-scoped state before applying later refresh messages
- **AND** MAY send a `project:bind` message to restore its previously viewed project
- **AND** MAY ignore interim `data:refresh` messages until the restore attempt resolves
