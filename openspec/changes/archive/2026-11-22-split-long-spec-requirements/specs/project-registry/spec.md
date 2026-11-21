## MODIFIED Requirements

### Requirement: Project registry persistence
The system SHALL maintain a project registry file at `${XDG_CONFIG_HOME:-~/.config}/openspec-webui/projects.json` holding a versioned JSON object with a `version` field, a `projects` array, and an `activeProjectId` string or null. Each project entry SHALL include `id`, `path`, `label`, `addedAt`, and `lastOpenedAt`. The system SHALL create the config directory and file at server startup if missing, SHALL NOT allow duplicate paths, and SHALL write the file atomically.

#### Scenario: Project entry fields
- **WHEN** a project entry is written to `projects.json`
- **THEN** `id` is a UUID
- **AND** `path` is the absolute normalized project-root path
- **AND** `label` is auto-derived from the directory name
- **AND** `addedAt` and `lastOpenedAt` are timestamps

#### Scenario: First startup with no config directory
- **WHEN** the server starts and `~/.config/openspec-webui/` does not exist
- **THEN** the system creates the directory and an empty `projects.json` with the current supported `version`, an empty `projects` array, and `activeProjectId` set to null

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
The system SHALL provide a `POST /api/projects` endpoint taking a JSON body with a `path` string, and SHALL validate that the path is an existing directory with an `openspec/` subdirectory. A valid, unregistered path SHALL get a new entry (generated UUID id, derived label, current timestamps); an already registered normalized path SHALL reactivate the existing entry instead of duplicating it. The system SHALL persist the updated registry and set the added or reactivated project as active.

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

### Requirement: Switch active project via API
The system SHALL provide a `POST /api/projects/:id/activate` endpoint that activates the target project as the global default. The system SHALL parse and prepare the target's OpenSpec data before committing the switch, SHALL start or reuse the target's file watcher session, SHALL NOT close other projects' watchers, and SHALL update and persist `activeProjectId`. Client-local binding remains with the WebSocket `project:bind` flow. A failed activation SHALL keep the previous state intact.

#### Scenario: Switch to a different project
- **WHEN** a POST request is sent to `/api/projects/def456/activate`
- **AND** `def456` is a registered project different from the current global default
- **THEN** the target project's OpenSpec data is parsed
- **AND** a new file watcher starts for the target project (or existing session is reused)
- **AND** other projects' watchers remain active
- **AND** `activeProjectId` is updated to `def456` as the global default
- **AND** the registry is persisted

#### Scenario: Switch to a project with malformed config.yaml
- **WHEN** a POST request is sent to `/api/projects/def456/activate`
- **AND** `def456` is registered
- **AND** `def456/openspec/config.yaml` is readable but malformed
- **THEN** the system activates the project successfully
- **AND** exposes project data with invalid planning context diagnostics
- **AND** does not return `ACTIVATION_FAILED`, because a malformed but readable `config.yaml` does not by itself count as an activation failure when degraded project data can still be built

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
- **AND** parsing or watcher setup for `def456` fails in a way that prevents degraded project data from being prepared
- **THEN** the server responds with an activation error
- **AND** the global default project remains unchanged
- **AND** all existing sessions remain intact

### Requirement: Initial project from current working directory
The system SHALL evaluate the current working directory at startup. When the registry has no projects, `activeProjectId` is null, and the working directory contains an `openspec/` subdirectory, the system SHALL add and activate it as a `POST /api/projects` call would. Existing registered projects SHALL keep the global default unchanged. A non-project working directory SHALL NOT add a project; the server SHALL start normally.

#### Scenario: First startup with a valid current working directory
- **WHEN** the server starts from `/home/user/my-repo`
- **AND** that directory is a valid OpenSpec project
- **AND** the registry is empty
- **THEN** the project is added to the registry and becomes active

#### Scenario: Startup with a valid CWD but existing projects
- **WHEN** the server starts from `/home/user/my-repo`
- **AND** that directory is a valid OpenSpec project
- **AND** one or more projects are already registered
- **THEN** the server starts normally
- **AND** the global default project remains unchanged

#### Scenario: Startup with a non-project current working directory
- **WHEN** the server starts from a directory that does not contain an `openspec/` subdirectory
- **THEN** the server starts normally
- **AND** the registry remains unchanged by startup bootstrap
