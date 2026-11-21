# client-project-binding Specification

## Purpose
Define how WebSocket clients bind to projects and receive project-scoped updates.

## Requirements

### Requirement: Client-project binding on WebSocket connect
When a WebSocket client connects, the system SHALL assign the client to the global default project. The system SHALL send a `connection:init` message containing `activeProjectId` (the client's bound project ID). The system SHALL increment the reference count of the bound project session.

#### Scenario: First client connects with a global default project
- **WHEN** a WebSocket client connects
- **AND** the global default project has an active session
- **THEN** the client is bound to that project
- **AND** the session's reference count increments
- **AND** the client receives `connection:init` with the bound project ID

#### Scenario: Client connects with no active sessions
- **WHEN** a WebSocket client connects
- **AND** no project sessions exist
- **THEN** the client is bound to the global default project ID (which may be null)
- **AND** the client receives `connection:init` with `activeProjectId: null`

### Requirement: Client-project binding on project switch
The system SHALL accept a WebSocket `project:bind` message to switch or confirm a client's binding. For a valid project ID that differs from the current binding, it SHALL update session reference counts and the binding. For any valid project ID, it SHALL then send the client `project:bound` with `activeProjectId` and current project data. `project:bound` SHALL remain the authoritative acknowledgment, even when a REST workflow already changed the global default project or the client's selection.

#### Scenario: Client switches to a different project
- **WHEN** a client sends `{ type: 'project:bind', projectId: 'def456' }`
- **AND** `def456` is a registered project
- **THEN** the new project's session refCount increments (session created if needed)
- **AND** the old project's session refCount decrements
- **AND** the client receives `{ type: 'project:bound', activeProjectId: 'def456', data: ... }`

#### Scenario: Client switches to an unregistered project
- **WHEN** a client sends `{ type: 'project:bind', projectId: 'nonexistent' }`
- **THEN** the client receives an error message
- **AND** the client's current binding remains unchanged

#### Scenario: Client confirms binding after API-driven project addition
- **WHEN** a client adds or reactivates a project through REST
- **AND** that workflow makes the same project the global default before the client has received `project:bound`
- **THEN** the client still sends `project:bind` for the created or reactivated project
- **AND** the server responds with `project:bound` containing that project's current data
- **AND** the client's project-scoped refresh runs only after that acknowledgment

#### Scenario: Client binds to its currently bound project
- **WHEN** a client sends `project:bind` with the project ID it is already bound to
- **THEN** no session refCount changes, because the target does not differ from the current binding
- **AND** the client receives `project:bound` with that project ID as `activeProjectId` and its current data

### Requirement: Per-client file change routing
The system SHALL route `data:refresh` WebSocket messages only to clients whose bound project matches the event's project. Clients bound to a different project SHALL NOT receive refresh events for other projects.

#### Scenario: File change in project A routed only to project A clients
- **WHEN** a file changes in project A
- **THEN** only clients bound to project A receive the `data:refresh` message
- **AND** clients bound to project B do not receive the event

#### Scenario: Multiple clients bound to the same project
- **WHEN** three clients are bound to project A
- **AND** a file changes in project A
- **THEN** all three clients receive the `data:refresh` message

### Requirement: Client unbind on disconnect
When a WebSocket client disconnects (close or error), the system SHALL decrement the reference count of the client's bound project session and remove the client from the binding map. If the reference count reaches zero, the session SHALL be released per the multi-project-sessions spec.

#### Scenario: Last client for a project disconnects
- **WHEN** the only client bound to project A disconnects
- **THEN** project A's session refCount becomes 0
- **AND** the file watcher is closed
- **AND** the session is removed

#### Scenario: One of multiple clients disconnects
- **WHEN** one of three clients bound to project A disconnects
- **THEN** project A's session refCount decrements from 3 to 2
- **AND** the file watcher remains active

### Requirement: Client reconnection restores binding context
When a WebSocket client reconnects, the system SHALL treat it as a new client bound to the global default project. The client SHALL read its last bound project ID from browser-local storage (`localStorage`). If a last bound project ID exists and differs from the `connection:init` value, the client SHALL send a `project:bind` message to restore its previous binding. If the stored project ID is absent from the current registry, the client SHALL discard it and use the `connection:init` value.

#### Scenario: Client reconnects after server restart
- **WHEN** a client reconnects after a server restart
- **AND** the client's `localStorage` contains a previously bound project ID
- **AND** that project is still registered
- **THEN** the client receives `connection:init` with the current global default project ID
- **AND** the client sends `project:bind` to switch to its last viewed project

#### Scenario: Client reconnects with a removed project in localStorage
- **WHEN** a client reconnects after a server restart
- **AND** the client's `localStorage` contains a project ID that is no longer registered
- **THEN** the client discards the stale localStorage value
- **AND** remains bound to the global default project from `connection:init`

#### Scenario: Client suppresses refreshes while restoring a prior binding
- **WHEN** a client reconnects and its local project differs from `connection:init`
- **AND** it immediately sends `project:bind` to restore the prior project
- **THEN** the client MAY ignore interim `data:refresh` messages until `project:bound` confirms the restored binding
