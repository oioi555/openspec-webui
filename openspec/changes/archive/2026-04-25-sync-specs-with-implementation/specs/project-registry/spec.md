# project-registry Delta Specification

## REMOVED Requirements

### Requirement: WebSocket project-switched event
The system SHALL broadcast a WebSocket message with `type: 'project:switched'` and a `projectId` field whenever the active project changes (add, activate, or remove). The `projectId` field SHALL contain the new active project id, or `null` when no active project remains. The system SHALL broadcast this event to all connected WebSocket clients.

#### Scenario: Broadcast on project switch
- **WHEN** the active project changes to another registered project via any API call
- **THEN** a WebSocket message `{ type: 'project:switched', projectId: 'def456' }` is sent to all connected clients

#### Scenario: Broadcast when the last project is removed
- **WHEN** the last registered project is removed and no active project remains
- **THEN** a WebSocket message `{ type: 'project:switched', projectId: null }` is sent to all connected clients
