## ADDED Requirements

### Requirement: ChangeViewer shows validation status above document tabs
The system SHALL display a compact validation status area for the current change in the ChangeViewer when validation state is available. The status area SHALL be placed above the change document tabs and content area, so validation context remains visible while the proposal/design/tasks/spec delta tabs remain immediately below for comparison. The status area SHALL derive its state from the latest project validation result and SHALL support passed, failed, unknown, and stale/no-result states.

#### Scenario: Change has validation failures
- **WHEN** the operator opens a change whose latest validation result contains one or more failed items for that change
- **THEN** the ChangeViewer displays a failed validation status above the change document tabs
- **AND** the status includes the issue count for that change

#### Scenario: Change has no validation failures in latest result
- **WHEN** the operator opens a change and the latest validation result passed or contains no failed item for that change
- **THEN** the ChangeViewer displays a passing or no-failures validation status above the change document tabs

#### Scenario: Change document tabs remain directly available
- **WHEN** the ChangeViewer renders validation status for a change
- **THEN** the existing change document tabs remain directly below the validation status area
- **AND** the operator does not need to scroll to the bottom of the page to switch between proposal, design, tasks, or spec delta documents

### Requirement: ChangeViewer validation details are collapsible
The ChangeViewer validation status area SHALL provide a collapsible Details region for the current change when validation messages are available. Expanding Details SHALL show only validation messages for the current change and SHALL keep the document tabs/content immediately below the validation area.

#### Scenario: Expand change validation details
- **WHEN** the current change has validation messages and the operator opens Details
- **THEN** the ChangeViewer displays the validation messages for that change
- **AND** the change document tabs remain immediately below the validation area

#### Scenario: Collapse change validation details
- **WHEN** validation Details are expanded in the ChangeViewer and the operator collapses them
- **THEN** only the compact status remains visible
- **AND** the change document tabs remain available below it
