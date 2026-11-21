## MODIFIED Requirements

### Requirement: Session reference counting
Each active session SHALL keep a reference count of bound clients that increments on bind and decrements on unbind (disconnects or switches to another project). When a client-driven decrement brings the count from a positive value to zero, the system SHALL close the file watcher and release the session's resources. The system SHALL NOT release a session while its count is above zero, and MAY retain an API-created or globally activated `refCount = 0` session until explicit cleanup.

#### Scenario: First client binds to a project
- **WHEN** a client requests a project that has no active session
- **THEN** the system creates a new session with refCount = 1
- **AND** starts a file watcher for that project

#### Scenario: Second client binds to the same project
- **WHEN** a client requests a project that already has an active session
- **THEN** the session's refCount increments
- **AND** no additional watcher is started

#### Scenario: Last client disconnects from a project
- **WHEN** a client disconnects or switches away from a project
- **AND** that project's session refCount becomes 0
- **THEN** the system closes the file watcher
- **AND** releases the parsed data
- **AND** removes the session

#### Scenario: API creates a session before any client binds
- **WHEN** a project-scoped API request creates an on-demand session for project A
- **AND** no WebSocket client is currently bound to project A
- **THEN** the session is created with `refCount = 0`
- **AND** the session remains available for subsequent requests
- **AND** it is not released solely because its current refCount is zero
- **AND** the same retention applies to a `refCount = 0` session created by global activation, until an explicit cleanup path runs

### Requirement: On-demand session creation via API
The system SHALL accept an `X-Project-Id` header on all project-scoped API endpoints. For a registered project without an active session, the system SHALL create a session on demand (parse the OpenSpec data and start a file watcher) with `refCount = 0` before responding. Without the header, the system SHALL use the global default project; for an unregistered project ID, it SHALL respond with a 404 error.

#### Scenario: Request with X-Project-Id for an inactive project
- **WHEN** a GET request is sent to `/api/specs` with `X-Project-Id: abc123`
- **AND** `abc123` is a registered project without an active session
- **THEN** the system creates a session for `abc123` by parsing its OpenSpec data and starting a file watcher, with `refCount = 0`
- **AND** returns the specs data from that session

#### Scenario: Request without X-Project-Id header
- **WHEN** a GET request is sent to `/api/specs` without an `X-Project-Id` header
- **THEN** the system returns data from the global default project session
- **AND** behaves identically to the current single-project behavior

#### Scenario: Request with invalid X-Project-Id
- **WHEN** a GET request is sent to `/api/specs` with `X-Project-Id: nonexistent`
- **THEN** the system responds with status 404
- **AND** an error indicating the project was not found
