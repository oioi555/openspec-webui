## ADDED Requirements

### Requirement: Project registry persistence
The system SHALL maintain a project registry file at `${XDG_CONFIG_HOME:-~/.config}/openspec-webui/projects.json`. The file SHALL contain a versioned JSON object with a `version` field, a `projects` array, and an `activeProjectId` string or null. Each project entry SHALL include `id` (UUID), `path` (absolute normalized project-root path), `label` (auto-derived from directory name), `addedAt` (timestamp), and `lastOpenedAt` (timestamp). The system SHALL create the config directory and file if they do not exist at server startup. The system SHALL NOT allow duplicate paths in the registry. The system SHALL write the file atomically.

#### Scenario: First startup with no config directory
- **WHEN** the server starts and `~/.config/openspec-webui/` does not exist
- **THEN** the system creates the directory and an empty `projects.json` with `version: 1`, an empty `projects` array, and `activeProjectId` set to null

#### Scenario: Startup restores persisted state
- **WHEN** the server starts and `projects.json` contains 2 project entries with `activeProjectId` set to the first entry's id
- **THEN** the system loads both projects into memory
- **AND** parses and watches only the active project
- **AND** the API returns the active project's data

#### Scenario: Config directory not writable
- **WHEN** the server starts and cannot create or write to `~/.config/openspec-webui/`
- **THEN** the server logs a warning
- **AND** starts with an empty in-memory project registry (no persistence)

#### Scenario: Recover from a corrupted registry file
- **WHEN** the server starts and `projects.json` contains invalid JSON or an unsupported schema version
- **THEN** the server logs a warning
- **AND** starts with an empty in-memory project registry or the last safely readable subset
- **AND** does not crash during startup

#### Scenario: Ignore persisted paths that no longer exist
- **WHEN** the server starts and a persisted project path no longer exists or no longer contains `openspec/`
- **THEN** the server logs a warning
- **AND** excludes that entry from the active in-memory registry

### Requirement: Add project via API
The system SHALL provide a `POST /api/projects` endpoint that accepts a JSON body with a `path` string. The system SHALL validate that the path is an existing directory containing an `openspec/` subdirectory. If valid and not already registered, the system SHALL create a new project entry with a generated UUID id, auto-derived label, and current timestamps. If the normalized path is already registered, the system SHALL reactivate the existing entry instead of creating a duplicate. The system SHALL persist the updated registry to `projects.json`. The system SHALL set the newly added or reactivated project as active.

#### Scenario: Add a valid project path
- **WHEN** a POST request is sent to `/api/projects` with `{"path": "/home/user/my-repo"}`
- **AND** `/home/user/my-repo/openspec/` is an existing directory
- **THEN** the server creates a new project entry
- **AND** the project becomes the active project
- **AND** the server parses the OpenSpec data and starts a file watcher
- **AND** the response returns the created project entry with status 201

#### Scenario: Add a path without openspec directory
- **WHEN** a POST request is sent to `/api/projects` with `{"path": "/home/user/my-repo"}`
- **AND** `/home/user/my-repo/openspec/` does not exist
- **THEN** the server responds with status 400 and an error message indicating the path is not a valid OpenSpec project

#### Scenario: Add a duplicate path
- **WHEN** a POST request is sent to `/api/projects` with a path that already exists in the registry
- **THEN** the server responds with status 200 and the existing project entry
- **AND** sets that project as active

### Requirement: List projects via API
The system SHALL provide a `GET /api/projects` endpoint that returns all project entries in the registry with the active project's `id` flagged.

#### Scenario: List multiple projects
- **WHEN** a GET request is sent to `/api/projects`
- **THEN** the response contains a `projects` array with all registered project entries
- **AND** an `activeProjectId` field indicating the currently active project

### Requirement: Remove project via API
The system SHALL provide a `DELETE /api/projects/:id` endpoint that removes the specified project from the registry. If the removed project was active, the system SHALL activate the first remaining project or set `activeProjectId` to null if no projects remain. The system SHALL stop the file watcher for the removed project if it was active. The system SHALL persist the updated registry.

#### Scenario: Remove the active project with others remaining
- **WHEN** a DELETE request is sent to `/api/projects/abc123`
- **AND** `abc123` is the active project
- **AND** other projects exist in the registry
- **THEN** the project is removed from the registry
- **AND** the first remaining project becomes active
- **AND** the server parses and watches the new active project

#### Scenario: Remove the only project
- **WHEN** a DELETE request is sent to `/api/projects/abc123`
- **AND** `abc123` is the only project in the registry
- **THEN** the project is removed from the registry
- **AND** `activeProjectId` is set to null
- **AND** no file watcher is active

#### Scenario: Remove a non-existent project
- **WHEN** a DELETE request is sent to `/api/projects/nonexistent`
- **THEN** the server responds with status 404

### Requirement: Switch active project via API
The system SHALL provide a `POST /api/projects/:id/activate` endpoint that switches the active project. The system SHALL parse and prepare the target project's OpenSpec data before committing the switch, SHALL update `activeProjectId`, start a new file watcher for the target project, persist the registry, and broadcast a WebSocket `project:switched` event with the new project id only after the new project is ready. If activation fails, the system SHALL keep the previous active project session intact.

#### Scenario: Switch to a different project
- **WHEN** a POST request is sent to `/api/projects/def456/activate`
- **AND** `def456` is a registered project different from the current active
- **THEN** the target project's OpenSpec data is parsed
- **AND** the previous file watcher is closed only after the new project is ready
- **AND** a new file watcher starts for the target project
- **AND** `activeProjectId` is updated to `def456`
- **AND** the registry is persisted
- **AND** a WebSocket `project:switched` event is broadcast

#### Scenario: Switch to the already active project
- **WHEN** a POST request is sent to `/api/projects/abc123/activate`
- **AND** `abc123` is already the active project
- **THEN** the server responds with success without re-parsing

#### Scenario: Switch to a non-existent project
- **WHEN** a POST request is sent to `/api/projects/nonexistent/activate`
- **THEN** the server responds with status 404

#### Scenario: Keep prior active project when activation fails
- **WHEN** a POST request is sent to `/api/projects/def456/activate`
- **AND** `def456` is registered
- **AND** parsing or watcher setup for `def456` fails
- **THEN** the server responds with an activation error
- **AND** the previously active project remains active
- **AND** the previous file watcher remains active

### Requirement: Existing API endpoints reference active project
The system SHALL serve all existing API endpoints (`/api/project`, `/api/specs`, `/api/specs/:name`, `/api/changes`, `/api/changes/:name`, `/api/stats`, `/api/search`, `/api/commands/availability`) using the active project's data or path context. When no project is active, the project/spec/change/stats/search endpoints SHALL respond with status 503 and an error indicating no active project, and command availability SHALL not return stale data from a previously active project.

#### Scenario: Command availability uses the project root
- **WHEN** a GET request is sent to `/api/commands/availability`
- **AND** an active project exists
- **THEN** the server resolves workflow availability using the active project's root path
- **AND** does not execute workflow inspection against `<projectRoot>/openspec`

#### Scenario: Get project data with active project
- **WHEN** a GET request is sent to `/api/project`
- **AND** an active project exists
- **THEN** the response contains the active project's project data

#### Scenario: Get project data with no active project
- **WHEN** a GET request is sent to `/api/project`
- **AND** no project is active
- **THEN** the response status is 503 with an error message

### Requirement: Project-management API errors are structured
The system SHALL return structured API errors for project-management and active-project context failures. Error responses SHALL include a stable `code` field and a human-readable `error` field so the frontend can distinguish `NO_ACTIVE_PROJECT`, `INVALID_PROJECT_PATH`, `PROJECT_NOT_FOUND`, and `ACTIVATION_FAILED` cases.

#### Scenario: Return a structured no-active-project error
- **WHEN** a project-scoped API endpoint is requested and no active project exists
- **THEN** the response includes `code: 'NO_ACTIVE_PROJECT'`
- **AND** includes a human-readable `error` message

#### Scenario: Return a structured activation failure error
- **WHEN** project activation fails during parse or watcher setup
- **THEN** the response includes `code: 'ACTIVATION_FAILED'`
- **AND** includes a human-readable `error` message

### Requirement: Initial project from environment variable
The system SHALL check the `OPENSPEC_INITIAL_PROJECT` environment variable at startup. If set to a valid directory path containing an `openspec/` subdirectory, the system SHALL add it to the registry and set it as active, equivalent to a `POST /api/projects` call. If the path is invalid, the system SHALL log a warning and continue without adding.

#### Scenario: Startup with valid OPENSPEC_INITIAL_PROJECT
- **WHEN** the server starts with `OPENSPEC_INITIAL_PROJECT=/home/user/my-repo`
- **AND** the path is a valid OpenSpec project
- **THEN** the project is added to the registry and becomes active

#### Scenario: Startup with invalid OPENSPEC_INITIAL_PROJECT
- **WHEN** the server starts with `OPENSPEC_INITIAL_PROJECT=/nonexistent`
- **THEN** the server logs a warning
- **AND** starts normally without the project

### Requirement: WebSocket project-switched event
The system SHALL broadcast a WebSocket message with `type: 'project:switched'` and a `projectId` field whenever the active project changes (add, activate, or remove). The `projectId` field SHALL contain the new active project id, or `null` when no active project remains. The system SHALL broadcast this event to all connected WebSocket clients.

#### Scenario: Broadcast on project switch
- **WHEN** the active project changes to another registered project via any API call
- **THEN** a WebSocket message `{ type: 'project:switched', projectId: 'def456' }` is sent to all connected clients

#### Scenario: Broadcast when the last project is removed
- **WHEN** the last registered project is removed and no active project remains
- **THEN** a WebSocket message `{ type: 'project:switched', projectId: null }` is sent to all connected clients

### Requirement: WebSocket connection initialization reflects the active project
The system SHALL send a WebSocket message with `type: 'connection:init'` and the current `activeProjectId` only to the connecting client immediately after that client connects so reconnecting clients can validate their current project context.

#### Scenario: Client reconnects after a project switch
- **WHEN** a client reconnects after missing one or more `project:switched` events
- **THEN** the first WebSocket message includes the current `activeProjectId`
- **AND** the client can reinitialize project-scoped state against that id
