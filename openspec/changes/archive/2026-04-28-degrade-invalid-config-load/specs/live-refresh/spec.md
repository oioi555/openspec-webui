## MODIFIED Requirements

### Requirement: Reparse and broadcast refresh events
On every relevant watcher event for an active session's project, the system SHALL reparse that project's full workspace, SHALL retain the fresh in-memory data set when parsing succeeds, and SHALL route a `data:refresh` WebSocket message only to clients bound to that project. The message SHALL identify the affected entity and entity ID. When a client binds to a project via `project:bind`, the system SHALL send a `project:bound` WebSocket message containing the new project ID and current data to the requesting client only. When a WebSocket client connects or reconnects, the system SHALL send a `connection:init` WebSocket message containing the client's bound project ID. A `config.yaml` parse failure that still produces degraded project data SHALL count as a successful project refresh rather than as a failed reparse.

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
