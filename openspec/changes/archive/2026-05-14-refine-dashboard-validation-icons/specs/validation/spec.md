## ADDED Requirements

### Requirement: Dashboard Active Changes status follows artifact completion cues
Dashboard Active Changes rows SHALL place compact validation status icons in the left-aligned title row after the change name and creation-state badges, and SHALL NOT render a trailing navigation arrow icon.

#### Scenario: Active change status appears after badges
- **WHEN** a Dashboard Active Changes row has a compact validation status to display
- **THEN** the row renders the status icon in the same title row as the change name
- **AND** the status icon appears after the Proposal badge when present
- **AND** the status icon appears after the Design badge when present
- **AND** the row does not render a trailing arrow icon

#### Scenario: Active change row remains clickable without arrow
- **WHEN** the operator clicks a Dashboard Active Changes row after the arrow icon has been removed
- **THEN** the row still opens the corresponding active change
- **AND** existing context menu open actions remain available

### Requirement: Dashboard Recent Activity shows validation status for validation targets
Dashboard Recent Activity rows SHALL display compact validation status icons for active changes and specs using shared validation target semantics. The icon SHALL be right-aligned in the row area previously occupied by the trailing arrow icon. Archived changes SHALL NOT display validation status icons.

#### Scenario: Recent active change shows right-aligned status
- **WHEN** a Dashboard Recent Activity item represents an active change with a compact validation status
- **THEN** the row displays the validation status icon on the right side of the row
- **AND** the row does not render a trailing arrow icon

#### Scenario: Recent spec shows right-aligned status
- **WHEN** a Dashboard Recent Activity item represents a spec with a compact validation status
- **THEN** the row displays the validation status icon on the right side of the row
- **AND** the row does not render a trailing arrow icon

#### Scenario: Recent archived change has no validation icon
- **WHEN** a Dashboard Recent Activity item represents an archived change
- **THEN** the row does not display a validation status icon
- **AND** the row does not render a trailing arrow icon

#### Scenario: Recent item remains clickable without arrow
- **WHEN** the operator clicks a Dashboard Recent Activity row after the arrow icon has been removed
- **THEN** the row still opens the corresponding item
- **AND** existing context menu open actions remain available
