# activity-bar Specification

## Purpose
Define the persistent Activity Bar that anchors primary navigation and quick actions in the redesigned three-pane layout.

## Requirements
### Requirement: Activity Bar renders persistent vertical control strip
The system SHALL render a vertical Activity Bar as the leftmost pane of the application layout, fixed at 48px width. The Activity Bar SHALL remain visible even when the Explorer Pane is collapsed. When an active project exists, the bottom area SHALL provide an Explorer open/close control rather than a current-project avatar tile. The bar SHALL display icon buttons in this order: Dashboard, Archive, Specs, a visual separator, and Search. The Dashboard control SHALL keep using the LayoutDashboard icon as the visual symbol for the primary landing surface. Each navigation icon SHALL use the `@lucide/svelte` library. When no active project exists, the bottom area SHALL fall back to the shared `app-icon.svg` and SHALL open project selection. The `decodeName` utility function used in the Activity Bar SHALL be imported from `$lib/utils` instead of being defined locally.

#### Scenario: Activity Bar renders on page load with explorer toggle
- **WHEN** the application loads with an active project
- **THEN** a vertical Activity Bar is displayed at the leftmost edge
- **AND** it contains an Explorer open/close control at the bottom
- **AND** it contains icon buttons for Dashboard, Archive, Specs, Search, and Settings
- **AND** each navigation icon renders at 20px size using `@lucide/svelte`

#### Scenario: Activity Bar renders no-project fallback icon
- **WHEN** the application loads without an active project
- **THEN** the bottom control renders the shared `app-icon.svg`
- **AND** activating the control still opens project selection

#### Scenario: Activity Bar has fixed width
- **WHEN** the application layout renders
- **THEN** the Activity Bar occupies exactly 48px width
- **AND** it does not resize with the window

#### Scenario: Activity Bar remains when Explorer Pane collapses
- **WHEN** the operator collapses the Explorer Pane
- **THEN** the Activity Bar remains visible at the left edge
- **AND** the Explorer toggle remains visible at the bottom
- **AND** all Activity Bar controls stay interactive

#### Scenario: Explorer toggle is visually separated from navigation icons
- **WHEN** the Activity Bar renders with an active project
- **THEN** the bottom Explorer control is grouped in the bottom area via `mt-auto`
- **AND** a horizontal rule separator appears between the Specs and Search navigation icons

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
The system SHALL respond to Activity Bar control clicks: the bottom Explorer control SHALL toggle the Explorer Pane open and closed without changing the active explorer preset; the Dashboard icon SHALL focus the Dashboard tab in the Main Viewer and expand the Explorer Pane with the ACTIVE CHANGES section focused while collapsing ARCHIVE and SPECS; the Archive icon SHALL expand the Explorer Pane with the ARCHIVE section focused while collapsing ACTIVE CHANGES and SPECS; the Specs icon SHALL expand the Explorer Pane with the SPECS section focused while collapsing ACTIVE CHANGES and ARCHIVE; the Search icon SHALL show a search panel or command palette; the Settings icon SHALL open the settings dialog. When the operator clicks the icon for the currently active section while the Explorer Pane is expanded, the Explorer Pane SHALL toggle between expanded and collapsed. The highlighted Activity Bar icon SHALL follow the active explorer preset even when the current Main Viewer tab does not change. The Dashboard icon SHALL focus the existing Dashboard tab without opening a new tab. The Archive and Specs icons SHALL NOT open or focus tabs in the Main Viewer.

#### Scenario: Explorer toggle opens collapsed pane
- **WHEN** the operator activates the bottom Explorer control while the Explorer Pane is collapsed
- **THEN** the Explorer Pane opens using the current explorer preset
- **AND** the active section highlight does not change

#### Scenario: Explorer toggle closes expanded pane
- **WHEN** the operator activates the bottom Explorer control while the Explorer Pane is open
- **THEN** the Explorer Pane closes
- **AND** the active section highlight does not change

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

#### Scenario: No-project fallback opens selector
- **WHEN** the operator clicks the bottom control in the Activity Bar while no project is active
- **THEN** the project selector opens
- **AND** the current view is not navigated away from

#### Scenario: Settings icon opens settings dialog
- **WHEN** the operator clicks the Settings icon
- **THEN** the settings dialog opens
- **AND** the current view is not navigated away from

### Requirement: Activity Bar tooltips
The system SHALL display a tooltip on hover for each Activity Bar icon and the bottom control, showing the control name (e.g., `Explorer`, `Dashboard`, `Specs`, `Archive`, `Search`, `Settings`, or the no-project selector label).

#### Scenario: Show tooltip on explorer toggle hover
- **WHEN** the operator hovers over the bottom Explorer control with an active project
- **THEN** a tooltip appears showing whether the control will open or close the Explorer Pane
- **AND** the tooltip disappears when the cursor leaves the control
