## ADDED Requirements

### Requirement: Expose project identity and documentation
The system SHALL derive the displayed project name from the parent directory name of the loaded OpenSpec directory, SHALL read `project.md` from that directory, SHALL expose the full markdown content, and SHALL derive the short description from the first paragraph after the top heading.

#### Scenario: Load project metadata from project.md
- **WHEN** the target OpenSpec directory contains a readable `project.md`
- **THEN** the system exposes the derived project name
- **AND** returns the full `project.md` content
- **AND** returns the first paragraph after the heading as the project description

#### Scenario: Fall back when project.md is missing
- **WHEN** the target OpenSpec directory does not contain `project.md`
- **THEN** the system still derives the project name from the directory name
- **AND** exposes an empty project content body
- **AND** uses `No project.md file found` as the fallback description

### Requirement: Summarize workspace metrics
The system SHALL report the total number of specs, the number of active changes, the number of archived changes, and the overall task progress aggregated from active changes only.

#### Scenario: Calculate overall progress from active changes
- **WHEN** active changes contain markdown task lists
- **THEN** the system aggregates completed and total tasks across active changes only
- **AND** returns the rounded completion percentage

#### Scenario: Report empty progress when no active tasks exist
- **WHEN** there are no active change tasks to count
- **THEN** the system reports `0` completed tasks
- **AND** reports `0%` overall progress

### Requirement: Provide dashboard and primary navigation context
The web UI SHALL provide top-level Dashboard, Specs, and Changes views, SHALL show the current project name in navigation, SHALL show counts for specs and active changes in navigation badges, and SHALL render the dashboard with metric cards, active change summaries, and project documentation when available.

#### Scenario: Render the dashboard with workspace summary
- **WHEN** the browser loads the dashboard
- **THEN** the system shows metric cards for total specs, active changes, archived changes, and overall progress
- **AND** lists active changes with their progress summaries
- **AND** renders the project documentation markdown when project content exists

#### Scenario: Show an empty active changes state
- **WHEN** the workspace has no active changes
- **THEN** the dashboard shows `No active changes`
- **AND** the Changes badge shows `0`
