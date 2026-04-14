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
The system SHALL provide a WebSocket message type `project:bind` that a client can send to switch its bound project. Upon receiving `project:bind` with a valid project ID, the system SHALL: decrement the old project session's reference count, increment the new project session's reference count (creating the session on demand if needed), update the client's binding, and send a `project:bound` message to the requesting client with the new project ID and the project's current data.

#### Scenario: Client switches to a different project
- **WHEN** a client sends `{ type: 'project:bind', projectId: 'def456' }`
- **AND** `def456` is a registered project
- **THEN** the old project's session refCount decrements
- **AND** the new project's session refCount increments (session created if needed)
- **AND** the client receives `{ type: 'project:bound', projectId: 'def456', data: ... }`

#### Scenario: Client switches to an unregistered project
- **WHEN** a client sends `{ type: 'project:bind', projectId: 'nonexistent' }`
- **THEN** the client receives an error message
- **AND** the client's current binding remains unchanged

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
When a WebSocket client reconnects, the system SHALL treat it as a new client bound to the global default project. The client SHALL reconcile its local state against the `connection:init` message. If the client previously had a different project bound, it MAY send a `project:bind` message to restore its previous binding.

#### Scenario: Client reconnects after server restart
- **WHEN** a client reconnects after a server restart
- **THEN** the client receives `connection:init` with the current global default project ID
- **AND** the client can send `project:bind` to switch to its previously viewed project

#### Scenario: Client suppresses refreshes while restoring a prior binding
- **WHEN** a client reconnects and its local project differs from `connection:init`
- **AND** it immediately sends `project:bind` to restore the prior project
- **THEN** the client MAY ignore interim `data:refresh` messages until `project:bound` confirms the restored binding
