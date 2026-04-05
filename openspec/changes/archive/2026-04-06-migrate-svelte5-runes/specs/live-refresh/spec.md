## MODIFIED Requirements

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
