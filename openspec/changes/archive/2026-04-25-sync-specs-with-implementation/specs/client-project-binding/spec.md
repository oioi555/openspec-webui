## MODIFIED Requirements

### Requirement: Client-project binding on project switch
The system SHALL provide a WebSocket message type `project:bind` that a client can send to switch its bound project. Upon receiving `project:bind` with a valid project ID, the system SHALL: increment the new project session's reference count (creating the session on demand if needed), decrement the old project session's reference count, update the client's binding, and send a `project:bound` message to the requesting client with the new project ID as `activeProjectId` and the project's current data.

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
