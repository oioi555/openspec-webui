## MODIFIED Requirements

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
