## MODIFIED Requirements

### Requirement: Reach an npm-installed OpenSpec CLI on Windows
On Windows with the OpenSpec CLI installed through npm (PATH contains npm's `openspec.cmd` shim), every WebUI subprocess that runs the OpenSpec CLI SHALL launch that shim successfully. The system SHALL NOT treat that install as missing solely because Node's `execFile` cannot run an extensionless `openspec` file or a `.cmd` file without a shell. POSIX hosts SHALL keep launching `openspec` directly with an argument list and no shell.

#### Scenario: Windows npm global install is found
- **WHEN** the host is Windows
- **AND** `openspec --version` succeeds in the same user environment that started OpenSpec WebUI
- **THEN** version lookup, command availability, Store discovery, and validation SHALL launch the OpenSpec CLI successfully
- **AND** SHALL NOT report the CLI as not installed

#### Scenario: POSIX launch stays a direct exec
- **WHEN** the host is Linux or macOS
- **AND** the WebUI launches the OpenSpec CLI
- **THEN** the process is started as `openspec` with a structured argument list
- **AND** the launch does not go through a shell
