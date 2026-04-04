## MODIFIED Requirements

### Requirement: Provide dashboard and primary navigation context
The web UI SHALL provide top-level Home, Changes, and Specs views, SHALL show the current project name in navigation, SHALL show counts for active changes and specs in navigation badges, and SHALL render the Home page with compact metric cards (Active Changes, Archived Changes, Total Specs), active change summaries, and project documentation when available. The Archived Changes metric card SHALL link to the Changes page, and the Total Specs metric card SHALL link to the Specs page. The Stats Cards SHALL display in the order: Active Changes, Archived Changes, Total Specs. The navigation SHALL NOT include a separate Dashboard link; the project logo/title SHALL link to the Home page.

#### Scenario: Render the Home page with workspace summary
- **WHEN** the browser loads the Home page (`/`)
- **THEN** the system shows compact metric cards for Active Changes, Archived Changes, and Total Specs in that order
- **AND** the Archived Changes card links to the Changes page (`/changes`)
- **AND** the Total Specs card links to the Specs page (`/specs`)
- **AND** the Active Changes card displays the overall task progress as an inline indicator
- **AND** lists active changes with their progress summaries
- **AND** renders the project documentation markdown when project content exists

#### Scenario: Show an empty active changes state
- **WHEN** the workspace has no active changes
- **THEN** the Home page shows `No active changes`
- **AND** the navigation Changes badge shows `0`

#### Scenario: Navigate from Stats Cards
- **WHEN** the operator clicks the Archived Changes metric card
- **THEN** the system navigates to the Changes page (`/changes`)
- **WHEN** the operator clicks the Total Specs metric card
- **THEN** the system navigates to the Specs page (`/specs`)

### Requirement: Summarize workspace metrics
The system SHALL report the total number of specs, the number of active changes, the number of archived changes, and the overall task progress aggregated from active changes only. The metric cards SHALL be rendered in a compact single-line format showing the count and label.

#### Scenario: Calculate overall progress from active changes
- **WHEN** active changes contain markdown task lists
- **THEN** the system aggregates completed and total tasks across active changes only
- **AND** returns the rounded completion percentage

#### Scenario: Report empty progress when no active tasks exist
- **WHEN** there are no active change tasks to count
- **THEN** the system reports `0` completed tasks
- **AND** reports `0%` overall progress

### Requirement: Change viewer back navigation
The system SHALL provide a back link in the ChangeViewer that navigates to the Home page (`/`) when viewing an active change, and to the Changes page (`/changes`) when viewing an archived change.

#### Scenario: Back link from an active change
- **WHEN** the operator views an active change
- **THEN** the ChangeViewer shows a back link pointing to the Home page (`/`)

#### Scenario: Back link from an archived change
- **WHEN** the operator views an archived change
- **THEN** the ChangeViewer shows a back link pointing to the Changes page (`/changes`)

### Requirement: Spec viewer back navigation
The system SHALL provide a back link in the SpecViewer that navigates to the Specs page (`/specs`).

#### Scenario: Back link from a spec
- **WHEN** the operator views a spec
- **THEN** the SpecViewer shows a back link pointing to the Specs page (`/specs`)
