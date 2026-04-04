# cli-runtime Specification

## Purpose
TBD - created by archiving change capture-baseline-specs. Update Purpose after archive.
## Requirements
### Requirement: Start a local workspace session
The system SHALL accept an OpenSpec-compatible directory path and port from the CLI, default the path to the current working directory, default the port to `3001`, bind to `127.0.0.1` unless configured otherwise, and reject paths that do not exist or are not directories.

#### Scenario: Start with defaults
- **WHEN** the operator runs `openspec-webui` without a path or port option
- **THEN** the system starts against the current working directory
- **AND** the local server listens on port `3001`

#### Scenario: Reject a missing workspace path
- **WHEN** the operator supplies a path that does not exist
- **THEN** the system reports that the path does not exist
- **AND** exits with a non-zero status

#### Scenario: Reject a non-directory path
- **WHEN** the operator supplies a path that resolves to a file instead of a directory
- **THEN** the system reports that the path is not a directory
- **AND** exits with a non-zero status

#### Scenario: Reject an occupied port
- **WHEN** the operator starts the UI on a port that is already in use
- **THEN** the system reports that the port is already in use
- **AND** suggests trying another port

### Requirement: Manage browser launch and session controls
The system SHALL open the browser to the running UI by default, SHALL skip auto-opening when `--no-open` is supplied, SHALL reopen the current UI URL when the operator presses `l` in an interactive terminal session, and SHALL shut down cleanly on `Ctrl+C`.

#### Scenario: Auto-open the browser on startup
- **WHEN** the operator starts the UI without `--no-open`
- **THEN** the system launches the default browser to the running local URL

#### Scenario: Skip browser auto-open
- **WHEN** the operator starts the UI with `--no-open`
- **THEN** the system starts the local server without launching a browser window

#### Scenario: Reopen the UI from the terminal
- **WHEN** the server is running in an interactive terminal and the operator presses `l`
- **THEN** the system launches the current UI URL in the browser again

### Requirement: Serve the web application shell
The system SHALL expose the JSON API routes, the websocket endpoint, and the browser UI from the same local server, and SHALL return the SPA entry document for non-API and non-websocket paths when a built frontend is available.

#### Scenario: Load a deep-linked UI route
- **WHEN** a browser requests a non-API UI path such as `/specs/<name>`
- **THEN** the system returns the SPA entry document
- **AND** allows the frontend router to resolve the view

#### Scenario: Start without built frontend assets
- **WHEN** the frontend build output is unavailable
- **THEN** the server still starts
- **AND** logs a warning that the frontend build is missing
