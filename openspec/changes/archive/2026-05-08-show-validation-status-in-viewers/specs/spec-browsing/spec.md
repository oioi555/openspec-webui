## ADDED Requirements

### Requirement: SpecViewer shows validation status above content
The system SHALL display a compact validation status area for the current capability spec in the SpecViewer when validation state is available. The status area SHALL be placed above the spec document content and below the viewer's primary header/metadata, so validation context is visible before the operator reads the document. The status area SHALL derive its state from the latest project validation result and SHALL support passed, failed, unknown, and stale/no-result states.

#### Scenario: Spec has validation failures
- **WHEN** the operator opens a spec whose latest validation result contains one or more failed items for that capability
- **THEN** the SpecViewer displays a failed validation status above the spec content
- **AND** the status includes the issue count for that spec

#### Scenario: Spec has no validation failures in latest result
- **WHEN** the operator opens a spec and the latest validation result passed or contains no failed item for that spec
- **THEN** the SpecViewer displays a passing or no-failures validation status above the spec content

#### Scenario: No validation result exists
- **WHEN** the operator opens a spec before validation has been run for the active project
- **THEN** the SpecViewer displays an unknown or not-yet-run validation status
- **AND** it does not imply that the spec has passed validation

### Requirement: SpecViewer validation details are collapsible
The SpecViewer validation status area SHALL provide a collapsible Details region for the current spec when validation messages are available. Expanding Details SHALL show the spec-specific validation messages without navigating away from the spec document.

#### Scenario: Expand spec validation details
- **WHEN** the current spec has validation messages and the operator opens Details
- **THEN** the SpecViewer displays the validation messages for that spec
- **AND** the spec document content remains immediately below the validation area

#### Scenario: Collapse spec validation details
- **WHEN** validation Details are expanded in the SpecViewer and the operator collapses them
- **THEN** only the compact status remains visible
- **AND** the spec document content remains available below it
