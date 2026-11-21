## MODIFIED Requirements

### Requirement: Activity Bar renders persistent vertical control strip
The system SHALL render a vertical Activity Bar as the leftmost pane of the application layout, fixed at 48px width and visible even when the Explorer Pane is collapsed. The bar SHALL display navigation icon buttons from the `@lucide/svelte` library in a fixed order, and its bottom area SHALL depend on whether an active project exists. The `decodeName` utility function used in the Activity Bar SHALL be imported from `$lib/utils` instead of being defined locally.

#### Scenario: Activity Bar renders on page load with explorer toggle
- **WHEN** the application loads with an active project
- **THEN** the Activity Bar is visible at 48px width on the left edge
- **AND** it contains icon buttons for Dashboard, Archive, Specs, Search, Validate, and Settings
- **AND** each navigation icon renders at 20px size using `@lucide/svelte`
- **AND** the icon buttons appear in this order: Dashboard, Archive, Specs, a visual separator, Search, and Validate
- **AND** the Dashboard control keeps using the LayoutDashboard icon as the visual symbol for the primary landing surface
- **AND** the bottom area provides an Explorer open/close control rather than a current-project avatar tile

#### Scenario: Activity Bar renders no-project app identity
- **WHEN** the application loads without an active project
- **THEN** the bottom control renders the shared `app-icon.svg` as a non-navigational app identity marker
- **AND** activating the control does not open project selection or toggle the Explorer Pane

#### Scenario: Activity Bar has fixed width
- **WHEN** the application layout renders
- **THEN** the Activity Bar is 48px wide
- **AND** it remains 48px regardless of Explorer Pane state

### Requirement: Activity Bar icons trigger explorer section or actions
The system SHALL respond to Activity Bar control clicks as each control's scenarios define. When the operator clicks the icon for the currently active explorer preset while its explorer surface is open, the Explorer Pane SHALL toggle between expanded and collapsed in wide layout, or between open and closed drawer states in narrow layout. The highlighted icon SHALL follow the active explorer preset even when the Main Viewer tab does not change.

#### Scenario: Explorer toggle opens collapsed pane
- **WHEN** the operator activates the bottom Explorer control while the Explorer Pane is collapsed
- **THEN** the Explorer Pane opens without changing the active explorer preset
- **AND** this applies only when an active project exists

#### Scenario: Explorer toggle closes expanded pane
- **WHEN** the operator activates the bottom Explorer control while the Explorer Pane is open
- **THEN** the Explorer Pane closes

#### Scenario: Explorer toggle is inert without active project
- **WHEN** the operator activates the bottom Explorer control while no project is active
- **THEN** no explorer or navigation state changes

#### Scenario: Dashboard icon focuses active changes
- **WHEN** the operator clicks the Dashboard icon
- **THEN** the Explorer Pane opens with the Dashboard tab focused in the Main Viewer
- **AND** the existing Dashboard tab is focused without opening a new tab
- **AND** the ACTIVE CHANGES section is expanded and focused
- **AND** the ARCHIVE and SPECS sections are collapsed

#### Scenario: Dashboard icon toggles explorer visibility
- **WHEN** the operator clicks the Dashboard icon while it is already active and the explorer surface is open
- **THEN** the explorer surface closes in the current responsive layout
- **AND** the Dashboard icon remains highlighted
- **AND** the Dashboard tab remains focused

#### Scenario: Archive icon focuses archive section
- **WHEN** the operator clicks the Archive icon
- **THEN** the Explorer Pane opens with the Archive section focused
- **AND** the ACTIVE CHANGES and SPECS sections are collapsed
- **AND** no tab is opened or focused in the Main Viewer
- **AND** the Archive icon is highlighted even though the current Main Viewer tab does not change

#### Scenario: Archive icon toggles explorer visibility
- **WHEN** the operator clicks the Archive icon while it is already active and the explorer surface is open
- **THEN** the explorer surface closes in the current responsive layout
- **AND** the Archive icon remains highlighted

#### Scenario: Specs icon focuses specs
- **WHEN** the operator clicks the Specs icon
- **THEN** the Explorer Pane opens with the Specs section focused
- **AND** the ACTIVE CHANGES and ARCHIVE sections are collapsed
- **AND** no tab is opened or focused in the Main Viewer

#### Scenario: Specs icon toggles explorer visibility
- **WHEN** the operator clicks the Specs icon while it is already active and the explorer surface is open
- **THEN** the explorer surface closes in the current responsive layout
- **AND** the Specs icon remains highlighted

#### Scenario: Search icon opens Search panel
- **WHEN** the operator clicks the Search icon
- **THEN** the Explorer Pane opens with the Search panel active
- **AND** no tab is opened or focused in the Main Viewer

#### Scenario: Validate icon opens Validation panel
- **WHEN** the operator clicks the Validate icon
- **THEN** the Explorer Pane opens with the Validation panel active
- **AND** no tab is opened or focused in the Main Viewer

#### Scenario: No-project app identity stays inert
- **WHEN** the operator clicks the bottom control in the Activity Bar while no project is active
- **THEN** no project selector opens
- **AND** the current view is not navigated away from
- **AND** no Explorer Pane state changes

#### Scenario: Settings icon opens settings tab
- **WHEN** the operator clicks the Settings icon
- **THEN** the Settings tab opens or focuses in the Main Viewer
- **AND** the current Explorer Pane preset is not changed
