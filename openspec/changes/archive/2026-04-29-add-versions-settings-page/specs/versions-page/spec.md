## ADDED Requirements

### Requirement: Collect tool version status at startup
The system SHALL build a version-status snapshot during server startup for `openspec-webui` and OpenSpec CLI. For `openspec-webui`, the snapshot SHALL include the current package version and the latest published npm version for `openspec-webui`. For OpenSpec CLI, the snapshot SHALL include the installed local CLI version from `openspec --version` when available and the latest published npm version for `@fission-ai/openspec`. Version lookups SHALL NOT block normal startup completion; if any lookup fails, the snapshot SHALL expose an unavailable or unknown state instead of aborting startup.

#### Scenario: Startup snapshot succeeds for both tools
- **WHEN** the server starts with network access to npm registry
- **AND** OpenSpec CLI is installed locally
- **THEN** the version snapshot contains current and latest version values for `openspec-webui`
- **AND** the version snapshot contains installed and latest version values for OpenSpec CLI

#### Scenario: Startup snapshot tolerates unavailable lookups
- **WHEN** the server starts and npm registry lookup fails or OpenSpec CLI cannot be executed
- **THEN** the server still starts normally
- **AND** the version snapshot marks the affected version fields as unavailable or unknown

### Requirement: Show a Versions page in settings
The settings dialog SHALL include a `Versions` category that displays installed/current version, latest version, and update status for both `openspec-webui` and OpenSpec CLI. The page SHALL show representative npm global-install update commands as the primary examples for both tools. Each tool section SHALL include a small copy action for its command text and a link to that tool's GitHub releases page.

#### Scenario: View Versions page when both tools are up to date
- **WHEN** the operator opens Settings and selects `Versions`
- **AND** both `openspec-webui` and OpenSpec CLI are on their latest versions
- **THEN** the page shows the current and latest version values for both tools
- **AND** the page shows both tools as up to date

#### Scenario: View Versions page when updates are available
- **WHEN** the operator opens Settings and selects `Versions`
- **AND** either `openspec-webui` or OpenSpec CLI has a newer latest version than the installed/current version
- **THEN** the page shows which tool has an update available
- **AND** the page shows the representative npm update command for that tool

#### Scenario: Copy an update command from the Versions page
- **WHEN** the operator clicks the copy action next to a displayed update command
- **THEN** the command text is copied to the clipboard

#### Scenario: Open a tool's releases page from the Versions page
- **WHEN** the operator clicks the releases link for `openspec-webui` or OpenSpec CLI
- **THEN** the UI opens that tool's GitHub releases page

#### Scenario: View Versions page when OpenSpec CLI is unavailable
- **WHEN** the operator opens Settings and selects `Versions`
- **AND** OpenSpec CLI is not installed or cannot be executed locally
- **THEN** the page shows that the installed OpenSpec CLI version is unavailable
- **AND** the page still shows the representative npm install/update command for OpenSpec CLI

### Requirement: Show post-upgrade OpenSpec project guidance
The Versions page SHALL explain that after upgrading OpenSpec CLI, the operator must run `openspec update` in each registered project. The page SHALL list registered project roots from the project registry as the set of projects that need that post-upgrade command, and SHALL provide a small copy action for the `openspec update` command text.

#### Scenario: Registered projects exist
- **WHEN** the operator opens Settings and selects `Versions`
- **AND** one or more projects are registered in the project registry
- **THEN** the page explains that `openspec update` must be run after an OpenSpec CLI upgrade
- **AND** the page lists the registered project roots as the projects to update

#### Scenario: No registered projects exist
- **WHEN** the operator opens Settings and selects `Versions`
- **AND** no projects are registered
- **THEN** the page still explains that `openspec update` must be run after an OpenSpec CLI upgrade
- **AND** the page shows no project list

#### Scenario: Copy the post-upgrade project command
- **WHEN** the operator clicks the copy action next to the `openspec update` guidance
- **THEN** the UI copies `openspec update` to the clipboard

### Requirement: Notify the browser once per latest-version snapshot
When the client initializes and the version snapshot indicates that a newer version of `openspec-webui` or OpenSpec CLI is available, the UI SHALL show a toast notification summarizing the available updates. The client SHALL suppress repeated toasts for the same latest-version snapshot in the same browser using browser storage. If the latest-version snapshot changes later, the client SHALL allow a new notification for the changed snapshot.

#### Scenario: Show toast on first load with updates available
- **WHEN** the client loads in a browser
- **AND** the version snapshot reports an available update for `openspec-webui` or OpenSpec CLI
- **AND** that latest-version snapshot has not been notified in that browser before
- **THEN** the UI shows a toast summarizing the available updates

#### Scenario: Suppress duplicate toast for the same snapshot
- **WHEN** the client loads again in the same browser
- **AND** the version snapshot still reports the same latest-version values as the last notified snapshot
- **THEN** the UI does not show the same update toast again

#### Scenario: Show a new toast when latest versions change
- **WHEN** the client loads in a browser after the server has a different latest-version snapshot than the last notified one
- **AND** the new snapshot reports an available update for `openspec-webui` or OpenSpec CLI
- **THEN** the UI shows a new toast for the changed snapshot
