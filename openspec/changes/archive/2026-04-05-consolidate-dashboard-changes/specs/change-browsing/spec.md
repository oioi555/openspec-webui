## MODIFIED Requirements

### Requirement: List active and archived changes
The system SHALL list active changes on the Home page alphabetically, SHALL list archived changes on the dedicated Changes page (`/changes`) newest-first by leading archive date when available, and SHALL expose per-change summary data including task progress, spec delta count, design presence, file counts, and archive status. Active changes SHALL be rendered by the shared `ActiveChangesList` component on the Home page only. The Changes page SHALL display only archived changes and SHALL be titled "Archived Changes".

#### Scenario: Show active change summaries
- **WHEN** the workspace contains active changes
- **THEN** the Home page lists them alphabetically using the `ActiveChangesList` component
- **AND** each summary includes an icon, name, spec delta count, and task progress
- **AND** the UI marks changes with design content using a design badge

#### Scenario: Show archived change summaries
- **WHEN** the workspace contains archived changes stored with `YYYY-MM-DD-` prefixes
- **THEN** the Changes page (`/changes`) lists them newest-first
- **AND** each summary includes the change name and archive date
- **AND** the UI displays them as completed archived items
- **AND** the page title is "Archived Changes"

#### Scenario: Empty archived changes page
- **WHEN** the workspace contains no archived changes
- **THEN** the Changes page shows `No archived changes`
