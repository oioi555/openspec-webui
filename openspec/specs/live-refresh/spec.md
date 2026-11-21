# live-refresh Specification

## Purpose
Define how the Web UI watches OpenSpec artifact changes and refreshes affected client views without requiring a manual reload.

## Requirements

### Requirement: Watch relevant OpenSpec files and directories
The system SHALL watch the OpenSpec project directory of each active session's project with its own independent chokidar watcher, created on session activation and closed when the session's reference count reaches zero. Each watcher SHALL treat supported markdown files, `project.md`, `AGENTS.md`, and `config.yaml` as relevant, SHALL ignore dotfiles, `node_modules`, and other non-markdown non-config files, and SHALL classify relevant updates as affecting `project`, `specs`, or `changes`.

#### Scenario: Classify unsupported markdown as project refresh
- **WHEN** a file event occurs for a markdown file not under `specs/`, `changes/`, and not named `project.md` or `AGENTS.md`
- **THEN** the watcher classifies the update as affecting `project`
- **AND** a project-scoped refresh is triggered

#### Scenario: Ignore irrelevant files
- **WHEN** a file event occurs for a dotfile, a file under `node_modules`, or a non-markdown non-config file
- **THEN** the watcher ignores the event

#### Scenario: Watcher follows the session lifecycle
- **WHEN** a project session is activated
- **THEN** its chokidar watcher is created
- **AND** the watcher is closed when the session's reference count reaches zero

#### Scenario: Classify a config change as project-scoped
- **WHEN** a file event occurs for `config.yaml` in a watched project
- **THEN** the system classifies the update as affecting `project`

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
On every relevant watcher event for an active session's project, the system SHALL reparse that project's full workspace, retain the fresh in-memory data when parsing succeeds, and route a `data:refresh` message naming the affected entity and entity ID only to that project's bound clients. The system SHALL send `project:bound` with the new project ID and data only to a client that binds via `project:bind`, and `connection:init` on connect or reconnect.

#### Scenario: Broadcast a change refresh after a markdown edit
- **WHEN** a markdown file changes inside a change directory in project A
- **THEN** the system reparses project A's workspace
- **AND** sends a `data:refresh` event for the `changes` entity only to clients bound to project A

#### Scenario: Broadcast a project refresh after valid config change
- **WHEN** `config.yaml` changes in project A
- **AND** the updated file parses successfully
- **THEN** the system reparses project A's workspace
- **AND** sends a `data:refresh` event for the `project` entity only to clients bound to project A

#### Scenario: Broadcast a project refresh after invalid config change
- **WHEN** `config.yaml` changes in project A
- **AND** the updated file is readable but malformed
- **THEN** the system reparses project A's workspace into degraded project data
- **AND** sends a `data:refresh` event for the `project` entity only to clients bound to project A
- **AND** the refreshed project data marks the planning context as invalid
- **AND** this `config.yaml` parse failure that still produces degraded project data counts as a successful project refresh rather than as a failed reparse

#### Scenario: Keep prior data on failed reparses
- **WHEN** a watcher-triggered reparse fails for a project in a way that prevents degraded project data from being produced
- **THEN** the system does not replace the previously loaded in-memory data

#### Scenario: Client switches project via bind message
- **WHEN** a client sends a `project:bind` WebSocket message with a valid project ID
- **THEN** the system sends a `project:bound` event to that client only with the new project ID and data
- **AND** other clients are unaffected

#### Scenario: Send bound project on websocket connect
- **WHEN** a websocket client connects
- **THEN** the system sends a `connection:init` websocket event containing the client's bound `activeProjectId`

#### Scenario: Send bound project on websocket reconnect
- **WHEN** a websocket client reconnects
- **THEN** the system sends a `connection:init` websocket event containing the client's bound project ID

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
- **AND** refreshes command availability for the new active project

#### Scenario: Reconcile project context after websocket reconnect
- **WHEN** the browser client reconnects and receives `connection:init`
- **AND** the announced `activeProjectId` differs from the client's current project context
- **THEN** it reinitializes project-scoped state before applying later refresh messages
- **AND** MAY send a `project:bind` message to restore its previously viewed project
- **AND** MAY ignore interim `data:refresh` messages until the restore attempt resolves

### Requirement: Watcher errors are not fatal
When a project's file watcher reports an error, the system SHALL log a warning that identifies the watched OpenSpec directory and SHALL keep the server and other project sessions running.

#### Scenario: Watcher reports an error
- **WHEN** the watcher for an active project emits an error
- **THEN** a warning naming the watched directory is logged
- **AND** the server process does not exit
