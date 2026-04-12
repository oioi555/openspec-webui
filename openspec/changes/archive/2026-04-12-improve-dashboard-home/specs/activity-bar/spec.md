## MODIFIED Requirements

### Requirement: Activity Bar renders persistent vertical control strip
The system SHALL render a vertical Activity Bar as the leftmost pane of the application layout, fixed at 48px width. The Activity Bar SHALL remain visible even when the Explorer Pane is collapsed. The top area SHALL provide a current project control, and the bar SHALL display icon buttons in this order: Dashboard, Archive, Specs, Search, and Settings. The Dashboard control SHALL keep using the house icon as the visual symbol for the primary landing surface. Each icon SHALL use the `@lucide/svelte` library. The `decodeName` utility function used in the Activity Bar SHALL be imported from `$lib/utils` instead of being defined locally.

#### Scenario: Activity Bar renders on page load
- **WHEN** the application loads
- **THEN** a vertical Activity Bar is displayed at the leftmost edge
- **AND** it contains a current project control
- **AND** it contains icon buttons for Dashboard, Archive, Specs, Search, and Settings
- **AND** each icon renders at 20px size using `@lucide/svelte`

#### Scenario: Activity Bar has fixed width
- **WHEN** the application layout renders
- **THEN** the Activity Bar occupies exactly 48px width
- **AND** it does not resize with the window

#### Scenario: Activity Bar remains when Explorer Pane collapses
- **WHEN** the operator collapses the Explorer Pane
- **THEN** the Activity Bar remains visible at the left edge
- **AND** all Activity Bar controls stay interactive

#### Scenario: decodeName imported from shared utils
- **WHEN** the ActivityBar component needs to decode a URI component
- **THEN** it imports `decodeName` from `$lib/utils`
- **AND** no local `decodeName` function is defined in ActivityBar.svelte

### Requirement: Activity Bar highlights active section
The system SHALL visually highlight the icon corresponding to the currently active explorer preset or view. Dashboard SHALL represent the Dashboard tab and ACTIVE CHANGES browsing, Archive SHALL represent ARCHIVE browsing, Specs SHALL represent spec browsing, Search SHALL represent the search panel, and Settings SHALL represent the settings dialog. When the operator clicks an inactive icon, the highlight SHALL move to that icon.

#### Scenario: Highlight active section on click
- **WHEN** the operator clicks the Search icon in the Activity Bar
- **THEN** the Search icon is visually highlighted
- **AND** the previously highlighted icon returns to default state

#### Scenario: Dashboard icon is active by default
- **WHEN** the application loads without a specific route
- **THEN** the Dashboard icon is highlighted in the Activity Bar

### Requirement: Activity Bar icons trigger explorer section or actions
The system SHALL respond to Activity Bar control clicks: the current project control SHALL open the project selector; the Dashboard icon SHALL focus the Dashboard tab in the Main Viewer and expand the Explorer Pane with the ACTIVE CHANGES section focused while collapsing ARCHIVE and SPECS; the Archive icon SHALL expand the Explorer Pane with the ARCHIVE section focused while collapsing ACTIVE CHANGES and SPECS; the Specs icon SHALL expand the Explorer Pane with the SPECS section focused while collapsing ACTIVE CHANGES and ARCHIVE; the Search icon SHALL show a search panel or command palette; the Settings icon SHALL open the settings dialog. When the operator clicks the icon for the currently active section while the Explorer Pane is expanded, the Explorer Pane SHALL toggle between expanded and collapsed. The highlighted Activity Bar icon SHALL follow the active explorer preset even when the current Main Viewer tab does not change. The Dashboard icon SHALL focus the existing Dashboard tab without opening a new tab. The Archive and Specs icons SHALL NOT open or focus tabs in the Main Viewer.

#### Scenario: Dashboard icon focuses Dashboard tab and expands explorer
- **WHEN** the operator clicks the Dashboard icon and the explorer is collapsed or a different section is active
- **THEN** the Dashboard tab is focused in the Main Viewer
- **AND** the Dashboard icon is highlighted
- **AND** the Explorer Pane is expanded
- **AND** the ACTIVE CHANGES section is expanded and focused
- **AND** the ARCHIVE and SPECS sections are collapsed

#### Scenario: Dashboard icon toggles explorer collapse
- **WHEN** the operator clicks the Dashboard icon while it is already active and the Explorer Pane is expanded
- **THEN** the Explorer Pane collapses
- **AND** the Dashboard icon remains highlighted
- **AND** the Dashboard tab remains focused

#### Scenario: Archive icon focuses archive
- **WHEN** the operator clicks the Archive icon and it is not the current active section
- **THEN** the Explorer Pane is expanded
- **AND** the Archive icon is highlighted
- **AND** the ARCHIVE section is expanded and focused
- **AND** the ACTIVE CHANGES and SPECS sections are collapsed
- **AND** no tab is opened or focused in the Main Viewer

#### Scenario: Archive icon toggles explorer collapse
- **WHEN** the operator clicks the Archive icon while it is already active and the Explorer Pane is expanded
- **THEN** the Explorer Pane collapses
- **AND** the Archive icon remains highlighted

#### Scenario: Specs icon focuses specs
- **WHEN** the operator clicks the Specs icon and it is not the current active section
- **THEN** the Explorer Pane is expanded
- **AND** the Specs icon is highlighted
- **AND** the SPECS section is expanded and focused
- **AND** the ACTIVE CHANGES and ARCHIVE sections are collapsed
- **AND** no tab is opened or focused in the Main Viewer

#### Scenario: Specs icon toggles explorer collapse
- **WHEN** the operator clicks the Specs icon while it is already active and the Explorer Pane is expanded
- **THEN** the Explorer Pane collapses
- **AND** the Specs icon remains highlighted

#### Scenario: Current project control opens selector
- **WHEN** the operator clicks the current project control in the Activity Bar
- **THEN** the project selector opens
- **AND** the current view is not navigated away from

#### Scenario: Settings icon opens settings dialog
- **WHEN** the operator clicks the Settings icon
- **THEN** the settings dialog opens
- **AND** the current view is not navigated away from

### Requirement: Activity Bar tooltips
The system SHALL display a tooltip on hover for each Activity Bar icon and the current project control, showing the control name (e.g., `Dashboard`, `Specs`, `Archive`, `Search`, `Settings`, current project name).

#### Scenario: Show tooltip on icon hover
- **WHEN** the operator hovers over an Activity Bar icon
- **THEN** a tooltip appears showing the section name
- **AND** the tooltip disappears when the cursor leaves the icon
