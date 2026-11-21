## MODIFIED Requirements

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
