## MODIFIED Requirements

### Requirement: Switch active project via API
The system SHALL provide a `POST /api/projects/:id/activate` endpoint that activates the target project as the global default. The system SHALL parse and prepare the target project's OpenSpec data before committing the switch, SHALL start a new file watcher for the target project (or reuse an existing session if one exists), SHALL NOT close any other project's watcher, SHALL update `activeProjectId` as the global default, and SHALL persist the registry. Client-local binding remains the responsibility of the WebSocket `project:bind` flow. If activation fails, the system SHALL keep the previous state intact.

#### Scenario: Switch to a different project
- **WHEN** a POST request is sent to `/api/projects/def456/activate`
- **AND** `def456` is a registered project different from the current global default
- **THEN** the target project's OpenSpec data is parsed
- **AND** a new file watcher starts for the target project (or existing session is reused)
- **AND** other projects' watchers remain active
- **AND** `activeProjectId` is updated to `def456` as the global default
- **AND** the registry is persisted

#### Scenario: Switch to the already active project
- **WHEN** a POST request is sent to `/api/projects/abc123/activate`
- **AND** `abc123` is already the global default project
- **THEN** the server responds with success without re-parsing

#### Scenario: Switch to a non-existent project
- **WHEN** a POST request is sent to `/api/projects/nonexistent/activate`
- **THEN** the server responds with status 404

#### Scenario: Keep prior state when activation fails
- **WHEN** a POST request is sent to `/api/projects/def456/activate`
- **AND** `def456` is registered
- **AND** parsing or watcher setup for `def456` fails
- **THEN** the server responds with an activation error
- **AND** the global default project remains unchanged
- **AND** all existing sessions remain intact
