## ADDED Requirements

### Requirement: Reach a standalone OpenSpec CLI on Windows
On Windows, the system SHALL first launch the OpenSpec CLI as a direct executable named `openspec` with a structured argument list and without a shell, so that a standalone `openspec.exe` on PATH is used. Only when that launch fails because the executable is not found SHALL the system fall back to npm's `openspec.cmd` shim, subject to the Windows-unsafe argument rule. The successful strategy SHALL be reused for later invocations in the same server process.

#### Scenario: Standalone install only
- **WHEN** the host is Windows and PATH contains `openspec.exe` but no `openspec.cmd`
- **THEN** version lookup, command availability, Store discovery, and validation launch the CLI without a shell
- **AND** the CLI is not reported as missing

#### Scenario: npm install only
- **WHEN** the host is Windows and PATH contains only npm's `openspec.cmd` shim
- **THEN** the direct launch reports not found, and the system launches the shim through the shell
- **AND** later invocations use the shim without retrying the direct launch
