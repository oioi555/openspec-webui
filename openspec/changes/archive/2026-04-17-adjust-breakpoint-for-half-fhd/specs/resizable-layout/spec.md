## MODIFIED Requirements

### Requirement: Narrow-width fallback keeps the Activity Bar visible
When the viewport width is below the desktop layout breakpoint, the system SHALL collapse the Explorer Pane from the persistent layout, keep the Activity Bar visible, and allow Explorer content to be opened temporarily from the `Home`, `Changes`, or `Specs` controls in the Activity Bar.

#### Scenario: Narrow layout hides the persistent Explorer Pane
- **WHEN** the viewport width becomes 960px or less
- **THEN** the persistent Explorer Pane is removed from the horizontal layout
- **AND** the Activity Bar remains visible at 48px width
- **AND** the Main Viewer fills the remaining width

#### Scenario: Narrow layout opens Explorer as temporary drawer
- **WHEN** the viewport width is 960px or less and the operator clicks the Home icon in the Activity Bar
- **THEN** the Explorer content opens in a temporary drawer or sheet
- **AND** the ACTIVE CHANGES section is expanded in that temporary surface
- **AND** closing the drawer returns the layout to Activity Bar + Main Viewer only
