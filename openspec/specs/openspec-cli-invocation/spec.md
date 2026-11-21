# openspec-cli-invocation Specification

## Purpose
Defines how OpenSpec WebUI launches the OpenSpec CLI so a normal npm global install is usable on Windows as well as POSIX hosts, without changing the existing missing-CLI degradation behavior.

## Requirements

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

### Requirement: Reject Windows-unsafe CLI arguments
On Windows, OpenSpec CLI arguments SHALL be passed to the shell only after each argument is verified to be free of `"`, `%`, and control characters. If any argument contains one of those characters, the invocation SHALL fail with an ordinary CLI-style error and SHALL NOT reach the shell. Arguments that contain `&`, `|`, `<`, `>`, `^`, or parentheses SHALL still be accepted when they are otherwise valid, because those characters are treated as literal inside a quoted region.

#### Scenario: Reject quote, percent, or control characters
- **WHEN** the host is Windows
- **AND** a WebUI OpenSpec CLI invocation would pass an argument containing `"`, `%`, or a control character
- **THEN** the invocation fails before a shell process is created
- **AND** the failure is reported as a command error rather than a successful empty result

#### Scenario: Accept ordinary OpenSpec arguments
- **WHEN** the host is Windows
- **AND** the arguments are OpenSpec subcommands, flags, config keys, or integers
- **THEN** the invocation is allowed to reach the CLI

### Requirement: Missing CLI still degrades as unavailable
When the OpenSpec CLI is genuinely not on PATH, or launching it fails for a reason other than the Windows npm-shim spawn problem, the existing unavailable / not-installed degradation for version status, command availability, Store discovery, and validation SHALL remain. This requirement does not change those products' response shapes.

#### Scenario: Absent CLI is still reported as missing
- **WHEN** no OpenSpec CLI shim or executable is present on PATH
- **THEN** version status, command availability, Store discovery, and validation continue to report their existing missing-CLI outcomes
- **AND** the WebUI continues to serve the rest of the session

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
