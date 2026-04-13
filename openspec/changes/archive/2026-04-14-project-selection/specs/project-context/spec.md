## MODIFIED Requirements

### Requirement: Expose project identity and documentation
The system SHALL derive the displayed project name from the parent directory name of the loaded OpenSpec directory, SHALL read `project.md` from that directory, SHALL expose the full markdown content, and SHALL derive the short description from the first paragraph after the top heading. The system SHALL return this data for the currently active project. When no project is active, the `/api/project` endpoint SHALL respond with status 503.

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

#### Scenario: No active project
- **WHEN** no project is active in the registry
- **THEN** `/api/project` responds with status 503

### Requirement: Provide dashboard and primary navigation context
The web UI SHALL provide an Obsidian-like three-pane layout with Activity Bar, Explorer Pane, and Main Viewer. The Dashboard page SHALL be accessible as a pinned `Dashboard` tab in the Main Viewer. The Activity Bar's top area SHALL show the shared application icon and current project control, and SHALL open the project selector without leaving the current tab. When the Explorer Pane is visible, it SHALL show the current project name in its header. Navigation highlighting SHALL be managed by the Activity Bar's active section indicator. The Dashboard SHALL render a workspace summary region with four metric cards ordered as Active Changes, Archive, Specs, and Tasks. The Specs summary card SHALL use the `FileText` icon so spec-related surfaces share a consistent visual cue. Selecting the Active Changes, Archive, or Specs cards SHALL focus the matching Explorer Pane section and reveal it when hidden without opening a standalone list page in the Main Viewer. Selecting the Tasks card SHALL focus the Dashboard / ACTIVE CHANGES context. The Dashboard SHALL render Active Changes with inline workspace command shortcuts in the section header, SHALL render Recent Activity as a full-width section beneath Active Changes when timestamp data is available, SHALL render the Recent Activity section header with a `History` icon, SHALL render recent activity entries as dense cards, SHALL use recent-activity icon treatments that align with the summary cards for each content type, SHALL NOT render separate Quick Actions or Next Step panels, SHALL provide an actionable empty state when no active changes exist, and SHALL render project documentation when available. When no project is active, the Dashboard SHALL NOT be displayed and the Main Viewer SHALL show the empty state instead.

#### Scenario: Render the Dashboard tab
- **WHEN** the operator clicks the Dashboard icon in the Activity Bar
- **AND** an active project exists
- **THEN** the Dashboard tab is focused in the Main Viewer
- **AND** the Dashboard shows summary cards in the order Active Changes, Archive, Specs, and Tasks
- **AND** the Dashboard shows the Active Changes section with inline command shortcuts
- **AND** the Dashboard shows Recent Activity in the main dashboard flow beneath Active Changes when recent items exist
- **AND** the Dashboard renders project documentation when available

#### Scenario: Dashboard unavailable with no active project
- **WHEN** the operator clicks the Dashboard icon in the Activity Bar
- **AND** no project is active
- **THEN** the Main Viewer shows the empty state
- **AND** the Explorer Pane is hidden

#### Scenario: Open project selector from the Activity Bar
- **WHEN** the operator clicks the current project control in the Activity Bar
- **THEN** the project selector opens
- **AND** the currently focused tab remains focused until the operator picks another project

#### Scenario: Show an empty active changes state
- **WHEN** the workspace has no active changes
- **THEN** the Dashboard shows `No active changes`

#### Scenario: Browse recent dashboard activity
- **WHEN** at least one change or spec exposes a timestamp for recent activity
- **THEN** the Dashboard shows recent activity entries ordered from newest to oldest
- **AND** selecting an entry opens the corresponding tab and focuses the related Explorer section

#### Scenario: Dashboard links to active changes browsing
- **WHEN** the operator clicks the Dashboard icon in the Activity Bar
- **THEN** the Explorer Pane expands the ACTIVE CHANGES section
- **AND** the Dashboard and Explorer together represent the `Dashboard` surface

#### Scenario: Navigation highlights active section via Activity Bar
- **WHEN** the operator is viewing a spec
- **THEN** the Specs icon in the Activity Bar is highlighted
- **WHEN** the operator is viewing an archived change
- **THEN** the Changes icon in the Activity Bar is highlighted
- **WHEN** the operator is viewing an active change
- **THEN** the Dashboard icon in the Activity Bar is highlighted
- **WHEN** the operator is viewing the Dashboard
- **THEN** the Dashboard icon in the Activity Bar is highlighted

### Requirement: Change viewer back navigation
The ChangeViewer SHALL NOT display a standalone back link. Navigation SHALL be handled by the Explorer Pane and tab system. The operator SHALL return to the Dashboard or Changes list via the Explorer Pane or by closing the tab.

#### Scenario: Navigate away from a change via Explorer
- **WHEN** the operator views a change and clicks a different item in the Explorer Pane
- **THEN** the new item opens in a tab
- **AND** the previous change tab remains open unless explicitly closed

### Requirement: Spec viewer back navigation
The SpecViewer SHALL NOT display a standalone back link. Navigation SHALL be handled by the Explorer Pane and tab system.

#### Scenario: Navigate away from a spec via Explorer
- **WHEN** the operator views a spec and clicks a different item in the Explorer Pane
- **THEN** the new item opens in a tab
- **AND** the previous spec tab remains open unless explicitly closed
