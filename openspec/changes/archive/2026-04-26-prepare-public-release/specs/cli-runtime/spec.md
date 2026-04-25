## MODIFIED Requirements

### Requirement: Start a local workspace session
The system SHALL start the WebUI without requiring a positional workspace path argument, SHALL default the port to `3001`, SHALL bind to `127.0.0.1` unless configured otherwise, and SHALL bootstrap the current working directory when it points to a valid OpenSpec project root (or its `openspec/` directory). If the current working directory is not a valid OpenSpec project, the system SHALL still start normally and leave project selection to the UI. The user-facing `package.json` scripts surface SHALL be limited to the essential development commands: `dev`, `build`, `test`, and `typecheck`. npm lifecycle hooks such as `prepublishOnly` MAY remain. The CLI version displayed by `openspec-webui --version` SHALL match the current published package version defined by the package metadata source of truth.

#### Scenario: Start from a valid current working directory
- **WHEN** the operator runs `openspec-webui` from `/home/user/my-repo`
- **AND** the current working directory is a valid OpenSpec project
- **THEN** the system starts normally
- **AND** bootstraps that project into the registry as the active project

#### Scenario: Start from a non-project current working directory
- **WHEN** the operator runs `openspec-webui` from a directory without an `openspec/` subdirectory
- **THEN** the system starts normally
- **AND** no project is auto-added from the working directory

#### Scenario: Reject an occupied port
- **WHEN** the operator starts the UI on a port that is already in use
- **THEN** the system reports that the port is already in use
- **AND** suggests trying another port

#### Scenario: README describes installation and usage for npm users
- **WHEN** a user visits the GitHub repository or npm page
- **THEN** the README SHALL provide clear installation instructions (`npm install -g openspec-webui` or `npx openspec-webui`)
- **AND** SHALL provide basic usage instructions (CLI commands, options)
- **AND** SHALL include a separate section for contributors (dev setup, build, test)

#### Scenario: Display version from package metadata
- **WHEN** the operator runs `openspec-webui --version`
- **THEN** the displayed version matches the current package version published from the package metadata source of truth
