## MODIFIED Requirements

### Requirement: Gate expanded-command controls by workflow availability
The system SHALL inspect local OpenSpec workflow availability for the currently active project before enabling expanded-command controls. When the active project changes or no active project remains, the availability state SHALL be refreshed so command controls do not reflect the previously active project.

#### Scenario: Refresh availability after switching projects
- **WHEN** the active project changes
- **THEN** the settings dialog refreshes workflow availability for the newly active project
- **AND** expanded-command controls reflect only that project's available workflows

#### Scenario: Clear availability when no project is active
- **WHEN** no project is active
- **THEN** the settings dialog shows expanded-command controls as unavailable
- **AND** does not reuse availability state from the previously active project

#### Scenario: Reconcile availability after websocket reconnect
- **WHEN** the client reconnects and learns that the active project changed while disconnected
- **THEN** the settings dialog refreshes workflow availability for the announced active project before rendering controls
