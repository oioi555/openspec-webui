## ADDED Requirements

### Requirement: Activity Bar renders persistent vertical control strip
The system SHALL render a vertical Activity Bar as the leftmost pane of the application layout, fixed at 48px width. The Activity Bar SHALL remain visible even when the Explorer Pane is collapsed. The top area SHALL provide a current project control, and the bar SHALL display icon buttons in this order: Home, Changes, Specs, Search, and Settings. Each icon SHALL use the `@lucide/svelte` library.

#### Scenario: Activity Bar renders on page load
- **WHEN** the application loads
- **THEN** a vertical Activity Bar is displayed at the leftmost edge
- **AND** it contains a current project control
- **AND** it contains icon buttons for Home, Changes, Specs, Search, and Settings
- **AND** each icon renders at 20px size using `@lucide/svelte`

#### Scenario: Activity Bar has fixed width
- **WHEN** the application layout renders
- **THEN** the Activity Bar occupies exactly 48px width
- **AND** it does not resize with the window

#### Scenario: Activity Bar remains when Explorer Pane collapses
- **WHEN** the operator collapses the Explorer Pane
- **THEN** the Activity Bar remains visible at the left edge
- **AND** all Activity Bar controls stay interactive

### Requirement: Activity Bar highlights active section
The system SHALL visually highlight the icon corresponding to the currently active explorer preset or view. Home SHALL represent the Dashboard tab and ACTIVE CHANGES browsing, Changes SHALL represent ARCHIVE browsing, Specs SHALL represent spec browsing, Search SHALL represent the search panel, and Settings SHALL represent the settings dialog. When the operator clicks an inactive icon, the highlight SHALL move to that icon.

#### Scenario: Highlight active section on click
- **WHEN** the operator clicks the Search icon in the Activity Bar
- **THEN** the Search icon is visually highlighted
- **AND** the previously highlighted icon returns to default state

#### Scenario: Home icon is active by default
- **WHEN** the application loads without a specific route
- **THEN** the Home icon is highlighted in the Activity Bar

### Requirement: Activity Bar icons trigger explorer section or actions
The system SHALL respond to Activity Bar control clicks: the current project control SHALL open the project selector; the Home icon SHALL show the Dashboard in the main viewer and expand the ACTIVE CHANGES section while collapsing ARCHIVE and SPECS; the Changes icon SHALL expand the Explorer Pane and the ARCHIVE section while collapsing ACTIVE CHANGES and SPECS; the Specs icon SHALL expand the Explorer Pane and the SPECS section while collapsing ACTIVE CHANGES and ARCHIVE; the Search icon SHALL show a search panel or command palette; the Settings icon SHALL open the settings dialog.

#### Scenario: Current project control opens selector
- **WHEN** the operator clicks the current project control in the Activity Bar
- **THEN** the project selector opens
- **AND** the current view is not navigated away from

#### Scenario: Home icon opens Dashboard
- **WHEN** the operator clicks the Home icon
- **THEN** the Dashboard tab is focused or opened in the main viewer
- **AND** the Home icon is highlighted in the Activity Bar

#### Scenario: Home icon restores Explorer and focuses active changes
- **WHEN** the operator clicks the Home icon while the Explorer Pane is collapsed
- **THEN** the Explorer Pane is expanded
- **AND** the ACTIVE CHANGES section is expanded
- **AND** the ARCHIVE and SPECS sections are collapsed

#### Scenario: Changes icon focuses archive
- **WHEN** the operator clicks the Changes icon while the Explorer Pane is collapsed
- **THEN** the Explorer Pane is expanded
- **AND** the ARCHIVE section is expanded
- **AND** the ACTIVE CHANGES and SPECS sections are collapsed

#### Scenario: Specs icon focuses specs after changes workflow
- **WHEN** the operator clicks the Specs icon
- **THEN** the SPECS section is expanded
- **AND** the ACTIVE CHANGES and ARCHIVE sections are collapsed

#### Scenario: Settings icon opens settings dialog
- **WHEN** the operator clicks the Settings icon
- **THEN** the settings dialog opens
- **AND** the current view is not navigated away from

### Requirement: Activity Bar tooltips
The system SHALL display a tooltip on hover for each Activity Bar icon and the current project control, showing the control name (e.g., "Home", "Specs", "Changes", "Search", "Settings", current project name).

#### Scenario: Show tooltip on icon hover
- **WHEN** the operator hovers over an Activity Bar icon
- **THEN** a tooltip appears showing the section name
- **AND** the tooltip disappears when the cursor leaves the icon
