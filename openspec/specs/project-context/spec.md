# project-context Specification

## Purpose
Define project identity, dashboard context, and navigation behavior for the Activity Bar, Explorer Pane, and tabbed Main Viewer.
## Requirements
### Requirement: Expose project identity and documentation
The system SHALL derive the displayed project name from the parent directory name of the loaded OpenSpec directory, SHALL read `config.yaml` from that directory, SHALL expose a structured planning context containing `AI Context`, `Artifact Rules`, and `Workflow Schema`, and SHALL derive the short description from the first non-empty line of `context:` when present. The system SHALL identify `config.yaml` as the active planning source for the currently active project. When a readable `project.md` exists, the system SHALL expose its content as deprecated supplemental documentation rather than as the active planning source. The system SHALL NOT use a missing `project.md` warning string as the project description. When no project is active, the `/api/project` endpoint SHALL respond with status 503.

#### Scenario: Load project planning context from config.yaml
- **WHEN** the target OpenSpec directory contains a readable `config.yaml`
- **THEN** the system exposes the derived project name
- **AND** returns the `context:` content as `AI Context`
- **AND** returns `rules:` grouped by artifact as `Artifact Rules`
- **AND** returns `schema:` as `Workflow Schema`

#### Scenario: Derive the short description from AI Context
- **WHEN** the target OpenSpec directory contains a non-empty `context:` block in `config.yaml`
- **THEN** the system derives the project description from the first non-empty line of that block

#### Scenario: Expose legacy project.md as deprecated supplemental documentation
- **WHEN** the target OpenSpec directory contains a readable `project.md` alongside `config.yaml`
- **THEN** the system exposes the `project.md` content as deprecated supplemental documentation
- **AND** does not identify `project.md` as the active planning source

#### Scenario: Avoid a missing-file warning description
- **WHEN** the target OpenSpec directory does not contain `project.md`
- **THEN** the system still derives the project name from the directory name
- **AND** does not use `No project.md file found` as the project description

#### Scenario: No active project
- **WHEN** no project is active in the registry
- **THEN** `/api/project` responds with status 503

### Requirement: Provide dashboard and primary navigation context
The web UI SHALL provide an Obsidian-like three-pane layout with Activity Bar, Explorer Pane, and Main Viewer. The Dashboard page SHALL be accessible as a pinned `Dashboard` tab in the Main Viewer. When a project is active, the Activity Bar SHALL act as navigation rail plus Explorer toggle rather than current-project identity surface. The current project identity SHALL be displayed text-first: the Dashboard title SHALL show the current project name, and the Explorer Pane header SHALL show a folder icon plus the current project name. The Dashboard header SHALL include a `folder-pen` project switch button adjacent to the title. The Explorer Pane header SHALL include a `folder-pen` project switch button on the right. When the Explorer Pane is collapsed, the Activity Bar SHALL remain visible but the current project identity MAY be hidden until the pane is reopened. In narrow layout, the Activity Bar SHALL remain visible while the Explorer drawer opens to its right. Navigation highlighting SHALL be managed by the Activity Bar's active section indicator. The Dashboard SHALL render a workspace summary region with four metric cards ordered as Active Changes, Archive, Specs, and Tasks. The Specs summary card SHALL use the `FileText` icon so spec-related surfaces share a consistent visual cue. The Dashboard summary cards, section containers, recent activity cards, active change cards, and planning-context containers SHALL use the shared Card surface pattern or thin wrappers built on that pattern instead of feature-local inline card foundations. Selecting the Active Changes, Archive, or Specs cards SHALL focus the matching Explorer Pane section and reveal it when hidden without opening a standalone list page in the Main Viewer. Selecting the Tasks card SHALL focus the Dashboard / ACTIVE CHANGES context. The Dashboard SHALL render Active Changes with inline workspace command shortcuts in the section header (the count is already shown in the summary cards above, so a separate badge is omitted for consistency with Recent Activity), SHALL render Recent Activity as a full-width section beneath Active Changes when timestamp data is available, SHALL render the Recent Activity section header with a `History` icon to indicate chronological updates, SHALL render recent activity entries as dense cards rather than sparse full-width list rows, SHALL use recent-activity icon treatments that align with the summary cards for each content type (active change/info, archive/muted, spec/success), SHALL NOT render separate Quick Actions or Next Step panels, SHALL provide an actionable empty state when no active changes exist, and SHALL render project documentation when available. Activating the Project Documentation `Focus section` control SHALL scroll to the documentation section without changing Explorer Pane visibility. The Dashboard SHALL align with the Explorer Pane's ACTIVE CHANGES section as the `Dashboard` surface. When no project is active, the Dashboard SHALL NOT be displayed and the Main Viewer SHALL show the empty state instead.

#### Scenario: Render the Dashboard tab
- **WHEN** the operator clicks the Dashboard icon in the Activity Bar
- **AND** an active project exists
- **THEN** the Dashboard tab is focused in the Main Viewer
- **AND** the Dashboard shows summary cards in the order Active Changes, Archive, Specs, and Tasks
- **AND** the Dashboard shows the Active Changes section with inline command shortcuts
- **AND** the Dashboard shows Recent Activity in the main dashboard flow beneath Active Changes when recent items exist
- **AND** the Dashboard renders the planning-context block

#### Scenario: Render planning context from config.yaml
- **WHEN** the operator views the Dashboard for an active project with readable `config.yaml`
- **THEN** the planning-context block identifies `openspec/config.yaml` as the planning source
- **AND** shows `AI Context`, `Artifact Rules`, and `Workflow Schema` in that order

#### Scenario: Show an empty artifact rules state
- **WHEN** the active project's `config.yaml` contains no artifact-specific rules
- **THEN** the `Artifact Rules` section shows an explicit empty state

#### Scenario: Show migration warning when only legacy context is populated
- **WHEN** the operator views the Dashboard for an active project whose `config.yaml` has empty `AI Context`
- **AND** deprecated supplemental `project.md` documentation exists
- **THEN** the planning-context block shows migration-focused warning copy
- **AND** does not show `No project.md file found`

#### Scenario: Show legacy project.md as collapsed deprecated disclosure
- **WHEN** deprecated supplemental `project.md` documentation exists for the active project
- **THEN** the planning-context block shows a collapsed disclosure labeled `Legacy project.md (Deprecated)`

#### Scenario: Dashboard unavailable with no active project
- **WHEN** the operator clicks the Dashboard icon in the Activity Bar
- **AND** no project is active
- **THEN** the Main Viewer shows the empty state
- **AND** the Explorer Pane is hidden

#### Scenario: Summary cards focus Explorer sections
- **WHEN** the operator activates the Archive or Specs summary card on Dashboard
- **THEN** the matching Explorer Pane section is expanded and focused
- **AND** the Main Viewer remains on the Dashboard tab instead of opening a standalone list page

#### Scenario: Open project selector from the Dashboard header
- **WHEN** the operator clicks the `folder-pen` button in the Dashboard header
- **THEN** the project selector opens

#### Scenario: Open project selector from the ExplorerPane header button
- **WHEN** the operator clicks the `folder-pen` button in the ExplorerPane header
- **THEN** the project selector opens
- **AND** the currently focused tab remains focused until the operator picks another project

#### Scenario: Collapsed explorer leaves navigation rail visible
- **WHEN** the Explorer Pane is collapsed in wide or medium layout
- **THEN** the Activity Bar remains visible
- **AND** the current project identity is no longer shown in the rail

#### Scenario: Narrow layout keeps Activity Bar visible beside the drawer
- **WHEN** the application is in narrow layout with an active project
- **THEN** the Activity Bar remains visible at the left edge
- **AND** opening the drawer shows the current project identity in the drawer header without hiding the rail

#### Scenario: No active project falls back to app identity
- **WHEN** no project is active
- **THEN** the top-left control shows the shared app icon
- **AND** the Main Viewer shows the empty state instead of the Dashboard

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

### Requirement: Expose a shared application favicon
The app shell SHALL reference `/app-icon.svg` as the browser favicon so the same branding asset is used for the navigation and browser chrome.

#### Scenario: Browser loads the shared favicon reference
- **WHEN** the browser loads the application HTML shell
- **THEN** the document includes a `rel="icon"` link whose `href` is `/app-icon.svg`
- **AND** the app shell does not require a separate `/favicon.svg` asset for branding

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
