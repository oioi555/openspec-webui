## ADDED Requirements

### Requirement: Simultaneous active project sessions
The system SHALL maintain zero or more active project sessions simultaneously, each identified by a project ID. Each session SHALL have its own file watcher and parsed OpenSpec data. The system SHALL support activating a project without deactivating any currently active project. The system SHALL persist `activeProjectId` as a global default project ID for backward compatibility while independently managing per-session state.

#### Scenario: Activate two projects simultaneously
- **WHEN** project A is already active with a running file watcher
- **AND** a client requests activation of project B
- **THEN** project B becomes active with its own file watcher
- **AND** project A's file watcher remains running
- **AND** both projects have independent parsed data

#### Scenario: Activate an already-active project from another client
- **WHEN** project A is already active with a running file watcher
- **AND** a new client requests activation of project A
- **THEN** the system reuses the existing session for project A
- **AND** no new watcher or parse operation is started
- **AND** the existing parsed data is returned

### Requirement: Session reference counting
Each active session SHALL maintain a reference count of bound clients. When a client binds to a project session, the reference count SHALL increment. When a client unbinds (disconnects or switches to another project), the reference count SHALL decrement. When a client-driven decrement causes the reference count to transition from a positive value to zero, the system SHALL close the file watcher and release the session's resources. The system SHALL NOT release a session while its reference count is greater than zero, and it MAY retain a `refCount = 0` session that was created by API access or global activation until an explicit cleanup path runs.

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

### Requirement: On-demand session creation via API
The system SHALL accept an `X-Project-Id` header on all project-scoped API endpoints. When the header specifies a registered project that does not yet have an active session, the system SHALL create a session on demand (parse the OpenSpec data and start a file watcher) before responding. An API-created session SHALL start with `refCount = 0`. When the header is absent, the system SHALL use the global default project. When the header specifies an unregistered project ID, the system SHALL respond with a 404 error.

#### Scenario: Request with X-Project-Id for an inactive project
- **WHEN** a GET request is sent to `/api/specs` with `X-Project-Id: abc123`
- **AND** `abc123` is a registered project without an active session
- **THEN** the system creates a session for `abc123`
- **AND** returns the specs data from that session

#### Scenario: Request without X-Project-Id header
- **WHEN** a GET request is sent to `/api/specs` without an `X-Project-Id` header
- **THEN** the system returns data from the global default project session
- **AND** behaves identically to the current single-project behavior

#### Scenario: Request with invalid X-Project-Id
- **WHEN** a GET request is sent to `/api/specs` with `X-Project-Id: nonexistent`
- **THEN** the system responds with status 404
- **AND** an error indicating the project was not found

### Requirement: Global default project
The system SHALL maintain a global default project ID (`activeProjectId` in the registry file) that serves as the fallback when no project is explicitly specified. The last project activated via `POST /api/projects/:id/activate` without a client context SHALL become the global default. The global default SHALL be used for: API requests without `X-Project-Id`, WebSocket `connection:init` for clients with no prior binding, and CLI startup.

#### Scenario: Global default persists across server restarts
- **WHEN** the server restarts
- **AND** the persisted `activeProjectId` references a valid registered project
- **THEN** that project becomes the global default
- **AND** a session is created for it when the first client or API request accesses it

#### Scenario: No global default when registry is empty
- **WHEN** no projects are registered
- **THEN** the global default is null
- **AND** project-scoped API endpoints respond with 503 NO_ACTIVE_PROJECT
