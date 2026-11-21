# continuous-integration Specification

## Purpose

Defines the automated checks that run for every change to the repository, so that tests, type checks, builds, and packaged installs on Windows are verified without manual effort.

## Requirements

### Requirement: Run repository checks on every push and pull request
The repository SHALL run its unit tests, type checks, and production build automatically for every push to `main` and every pull request, on both Linux and Windows, using a Node.js version within the supported `engines` range. The workflow SHALL use read-only repository permissions and bounded job timeouts.

#### Scenario: Pull request is opened
- **WHEN** a pull request is opened or updated
- **THEN** tests, type checks, and the build run on Linux and on Windows
- **AND** any failing step marks the run as failed

#### Scenario: Minimum supported Node.js
- **WHEN** the checks run
- **THEN** at least one Linux job uses the minimum Node.js version declared in `engines`

### Requirement: Smoke-test the packaged CLI on Windows with an npm OpenSpec install
CI SHALL install OpenSpec from npm on Windows, install this repository's packed tarball globally, start `openspec-webui` without opening a browser, and verify that `/api/version-status` finishes loading and reports OpenSpec as installed with a semver `currentVersion` and `installManager` equal to `npm`. The job SHALL confirm that only the `openspec.cmd` shim is on PATH so success proves the shim fallback.

#### Scenario: npm-installed OpenSpec is detected through the shim
- **WHEN** the Windows npm smoke job runs
- **THEN** no `openspec.exe` is on PATH and `openspec.cmd` is
- **AND** the version status reports `notInstalled` false, a semver version, and `installManager` `npm`

### Requirement: Smoke-test the packaged CLI on Windows with a standalone OpenSpec install
CI SHALL install OpenSpec on Windows with the official non-interactive standalone installer, install this repository's packed tarball globally, start `openspec-webui`, and verify that `/api/version-status` reports OpenSpec as installed with a semver `currentVersion`. The reported `installManager` SHALL be logged as reported by the CLI rather than asserted to a fixed value.

#### Scenario: Standalone OpenSpec is detected
- **WHEN** the Windows standalone smoke job runs
- **THEN** the version status reports `notInstalled` false and a semver `currentVersion`

### Requirement: Smoke test cleans up after itself
The smoke test SHALL listen on a free port chosen at runtime and SHALL stop the server process it started, including its child processes, whether the assertions pass or fail.

#### Scenario: Assertion fails
- **WHEN** a smoke assertion fails
- **THEN** the started server is stopped and the script exits non-zero
