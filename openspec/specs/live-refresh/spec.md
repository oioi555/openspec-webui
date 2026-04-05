# live-refresh Specification

## Purpose
TBD - created by archiving change capture-baseline-specs. Update Purpose after archive.
## Requirements
### Requirement: Watch relevant OpenSpec files and directories
The system SHALL watch the loaded OpenSpec directory for markdown and HTML file changes, SHALL ignore dotfiles and `node_modules`, and SHALL classify relevant updates as affecting `project`, `specs`, or `changes`.

#### Scenario: Ignore unsupported file changes
- **WHEN** a file event occurs for a non-markdown and non-HTML file
- **THEN** the watcher ignores the event

#### Scenario: Classify a spec file change
- **WHEN** a file event occurs under `specs/<capability>/`
- **THEN** the system classifies the update as affecting `specs`
- **AND** uses the capability directory name as the affected entity ID

#### Scenario: Classify a change directory event
- **WHEN** a directory is added or removed under `changes/` or `changes/archive/`
- **THEN** the system classifies the update as affecting `changes`

### Requirement: Reparse and broadcast refresh events
On every relevant watcher event, the system SHALL reparse the full OpenSpec workspace, SHALL retain the fresh in-memory data set when parsing succeeds, and SHALL broadcast a `data:refresh` websocket message that identifies the affected entity and entity ID.

#### Scenario: Broadcast a change refresh after a markdown edit
- **WHEN** a markdown file changes inside a change directory
- **THEN** the system reparses the workspace
- **AND** broadcasts a `data:refresh` event for the `changes` entity

#### Scenario: Keep prior data on failed reparses
- **WHEN** a watcher-triggered reparse fails
- **THEN** the system does not replace the previously loaded in-memory data

### Requirement: Hot-refresh the browser without losing context
The browser client SHALL refetch the affected entity collections over HTTP after a `data:refresh` message, SHALL always refresh workspace stats, SHALL preserve the current scroll position across the update, and SHALL keep the current spec tab or change group/file selection when the selection is still valid. The WebSocket subscription SHALL be managed via `$effect` rune instead of `onMount` with manual cleanup.

#### Scenario: Refresh a spec detail view in place
- **WHEN** a websocket refresh targets specs while a spec detail view is open
- **THEN** the client reloads the spec data
- **AND** keeps the current detail view active without showing the initial loading state again

#### Scenario: Refresh a change detail view in place
- **WHEN** a websocket refresh targets changes while a change detail view is open
- **THEN** the client reloads the change data
- **AND** preserves the selected change tab and file selection when those indices still exist

#### Scenario: Show an update notification
- **WHEN** a websocket refresh targets a specific entity instead of `all`
- **THEN** the client shows a toast identifying the updated entity or item

#### Scenario: WebSocket subscription lifecycle via $effect
- **WHEN** the App component mounts with an `$effect` that sets up the WebSocket subscription
- **THEN** the subscription is established
- **AND** when the component destroys, the `$effect` cleanup function unsubscribes and disconnects the WebSocket
