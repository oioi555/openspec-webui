## MODIFIED Requirements

### Requirement: Start a local workspace session
The system SHALL start the WebUI without requiring a positional workspace path argument, SHALL default the port to `3001`, SHALL bind to `127.0.0.1` unless configured otherwise, and SHALL bootstrap an initial project from the `OPENSPEC_INITIAL_PROJECT` environment variable when it is set to a valid OpenSpec project path. Wrapper scripts MAY translate their own convenience arguments into `OPENSPEC_INITIAL_PROJECT`, but the standalone CLI contract SHALL remain argument-free for project selection.

#### Scenario: Start with defaults
- **WHEN** the operator runs `openspec-webui` without a project argument or port option
- **THEN** the system starts without validating the current working directory as a workspace
- **AND** the local server listens on port `3001`

#### Scenario: Start with OPENSPEC_INITIAL_PROJECT
- **WHEN** the operator starts the UI with `OPENSPEC_INITIAL_PROJECT=/home/user/my-repo`
- **AND** the path points to a valid OpenSpec project
- **THEN** the system starts normally
- **AND** bootstraps that project into the registry as the active project

#### Scenario: Ignore an invalid OPENSPEC_INITIAL_PROJECT
- **WHEN** the operator starts the UI with `OPENSPEC_INITIAL_PROJECT` set to an invalid path
- **THEN** the system reports a warning
- **AND** continues starting the server without exiting

#### Scenario: Wrapper script maps a project argument to bootstrap env
- **WHEN** the operator runs a wrapper such as `npm run dev -- /path/to/project`
- **THEN** the wrapper passes `/path/to/project` via `OPENSPEC_INITIAL_PROJECT`
- **AND** does not pass a positional workspace path argument to `openspec-webui`

#### Scenario: Reject an occupied port
- **WHEN** the operator starts the UI on a port that is already in use
- **THEN** the system reports that the port is already in use
- **AND** suggests trying another port
