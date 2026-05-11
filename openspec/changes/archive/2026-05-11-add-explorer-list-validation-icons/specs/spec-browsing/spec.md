## MODIFIED Requirements

### Requirement: Catalog capability specs
The system SHALL discover capability directories under `specs/`, sort them alphabetically by default, and display them in the Explorer Pane's SPECS collapsible section. The operator SHALL be able to switch the SPECS section between `Name` ordering and `Date` ordering from the section header. When `Date` ordering is selected, specs SHALL be sorted by last modification datetime descending. Spec rows SHALL display a compact trailing validation icon only when the latest validation target status for that spec is `failed`, `warning`, or `info`.

#### Scenario: Show spec validation attention icon
- **WHEN** the Explorer Pane renders a spec whose latest validation target status is `failed`, `warning`, or `info`
- **THEN** the row shows the corresponding shared validation icon as a compact trailing status indicator on the first line

#### Scenario: Hide spec pass icon
- **WHEN** the Explorer Pane renders a spec whose latest validation target status is `passed`
- **THEN** the row does not display a trailing validation icon
- **AND** the list remains focused on attention states rather than successful validation noise

#### Scenario: Hide non-actionable spec validation states
- **WHEN** the Explorer Pane renders a spec whose latest validation target status is `not-run`, `stale`, or `unknown`
- **THEN** the row does not display a trailing validation icon
