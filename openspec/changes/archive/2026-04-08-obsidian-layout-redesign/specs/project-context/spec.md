## MODIFIED Requirements

### Requirement: Provide dashboard and primary navigation context
The web UI SHALL provide an Obsidian-like three-pane layout with Activity Bar, Explorer Pane, and Main Viewer. The Home page (Dashboard) SHALL be accessible as a tab in the Main Viewer. The Activity Bar's top area SHALL show the shared application icon and current project control, and SHALL open the project selector without leaving the current tab. When the Explorer Pane is visible, it SHALL show the current project name in its header. Navigation highlighting SHALL be managed by the Activity Bar's active section indicator. The Dashboard SHALL render Active Changes and project documentation within the Main Viewer tab, and SHALL align with the Explorer Pane's ACTIVE CHANGES section as the `Home` surface.

#### Scenario: Render the Dashboard tab
- **WHEN** the operator clicks the Home icon in the Activity Bar
- **THEN** the Dashboard tab is focused in the Main Viewer
- **AND** the Dashboard shows Active Changes section with a count badge
- **AND** the Dashboard renders project documentation when available

#### Scenario: Open project selector from the Activity Bar
- **WHEN** the operator clicks the current project control in the Activity Bar
- **THEN** the project selector opens
- **AND** the currently focused tab remains focused until the operator picks another project

#### Scenario: Show an empty active changes state
- **WHEN** the workspace has no active changes
- **THEN** the Dashboard shows "No active changes"

#### Scenario: Home links to active changes browsing
- **WHEN** the operator clicks the Home icon in the Activity Bar
- **THEN** the Explorer Pane expands the ACTIVE CHANGES section
- **AND** the Dashboard and Explorer together represent the `Home → ACTIVE CHANGES` surface

#### Scenario: Navigation highlights active section via Activity Bar
- **WHEN** the operator is viewing a spec
- **THEN** the Specs icon in the Activity Bar is highlighted
- **WHEN** the operator is viewing an archived change
- **THEN** the Changes icon in the Activity Bar is highlighted
- **WHEN** the operator is viewing an active change
- **THEN** the Home icon in the Activity Bar is highlighted
- **WHEN** the operator is viewing the Dashboard
- **THEN** the Home icon in the Activity Bar is highlighted

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
