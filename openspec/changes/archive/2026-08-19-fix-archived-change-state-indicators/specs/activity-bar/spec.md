## ADDED Requirements

### Requirement: Activity Bar follows Change archive transitions
The Activity Bar SHALL resolve the active section from refreshed Change archive state using the same original-name and date-prefixed archive-name correspondence as the Change tab indicator.

#### Scenario: Open Change moves to Archive section after archive
- **WHEN** the active tab shows a Change under its original name
- **AND** refreshed workspace data contains a date-prefixed archive entry corresponding to that original name
- **THEN** the Activity Bar highlights Archive without requiring the tab to be closed or reopened
