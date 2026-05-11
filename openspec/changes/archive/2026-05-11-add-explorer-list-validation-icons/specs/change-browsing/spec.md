## MODIFIED Requirements

### Requirement: List active and archived changes
The system SHALL list active changes in the Explorer Pane's ACTIVE CHANGES collapsible section, sorted by last modification datetime descending by default. The system SHALL list archived changes in the Explorer Pane's ARCHIVE collapsible section, also sorted by last modification datetime descending by default rather than by archive-date prefix. The operator SHALL be able to switch both ACTIVE CHANGES and ARCHIVE between `Date` ordering and `Name` ordering from the section header. When `Name` ordering is selected for archived changes, the comparison key SHALL be the visible archived change name with the leading `YYYY-MM-DD-` prefix removed. The ACTIVE CHANGES section SHALL be rendered before the ARCHIVE section so the workflow reads from active work to historical reference. Each entry SHALL display the change name and task progress. Active change entries SHALL also display a compact trailing validation icon for `failed`, `warning`, `info`, or `passed` when the latest validation state for that active change is available. Archived change entries SHALL NOT display inline validation status icons. The Activity Bar SHALL align with these sections as `Home -> ACTIVE CHANGES` and `Archive -> ARCHIVE`.

#### Scenario: Show active change validation pass state
- **WHEN** the Explorer Pane renders an active change whose latest validation target status is `passed`
- **THEN** the row shows the shared pass icon as a compact trailing status indicator on the first line
- **AND** the rest of the row layout and metadata remain unchanged

#### Scenario: Show active change validation attention state
- **WHEN** the Explorer Pane renders an active change whose latest validation target status is `failed`, `warning`, or `info`
- **THEN** the row shows the corresponding shared validation icon as a compact trailing status indicator on the first line

#### Scenario: Archived changes never show validation icons
- **WHEN** the Explorer Pane renders an archived change row
- **THEN** the row does not display a trailing validation icon even if a validation result exists for similarly named active items
