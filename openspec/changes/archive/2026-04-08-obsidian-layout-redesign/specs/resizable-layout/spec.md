## ADDED Requirements

### Requirement: Three-pane resizable layout
The system SHALL render a three-pane horizontal layout consisting of: Activity Bar (fixed width), Explorer Pane (resizable), and Main Viewer (flex) when sufficient horizontal space exists. The layout SHALL fill the full viewport height and width with no scrolling on the outer container.

#### Scenario: Full viewport layout
- **WHEN** the application loads
- **THEN** the three-pane layout fills the entire viewport
- **AND** no outer scrollbar appears on the body element

#### Scenario: Main Viewer fills remaining space
- **WHEN** the Explorer Pane is set to 240px width
- **THEN** the Main Viewer occupies the remaining viewport width minus the Activity Bar (48px) and Explorer Pane (240px)

### Requirement: Resizable pane divider
The system SHALL render a draggable divider between the Explorer Pane and the Main Viewer. Dragging the divider SHALL resize both panes. The divider SHALL provide visual feedback on hover and drag.

#### Scenario: Drag divider to resize
- **WHEN** the operator drags the pane divider to the right
- **THEN** the Explorer Pane width increases
- **AND** the Main Viewer width decreases accordingly

#### Scenario: Visual feedback on divider hover
- **WHEN** the operator hovers over the pane divider
- **THEN** the divider shows a visual highlight or cursor change indicating it is draggable

### Requirement: Pane size constraints
The Explorer Pane SHALL have a minimum width of 180px and a maximum width of 400px. The Main Viewer SHALL have a minimum width of 300px.

#### Scenario: Prevent Explorer Pane from becoming too narrow
- **WHEN** the operator drags the divider to attempt making the Explorer Pane narrower than 180px
- **THEN** the divider stops at 180px

#### Scenario: Prevent Explorer Pane from becoming too wide
- **WHEN** the operator drags the divider to attempt making the Explorer Pane wider than 400px
- **THEN** the divider stops at 400px

### Requirement: Narrow-width fallback keeps the Activity Bar visible
When the viewport width is below the desktop layout breakpoint, the system SHALL collapse the Explorer Pane from the persistent layout, keep the Activity Bar visible, and allow Explorer content to be opened temporarily from the `Home`, `Changes`, or `Specs` controls in the Activity Bar.

#### Scenario: Narrow layout hides the persistent Explorer Pane
- **WHEN** the viewport width becomes less than 768px
- **THEN** the persistent Explorer Pane is removed from the horizontal layout
- **AND** the Activity Bar remains visible at 48px width
- **AND** the Main Viewer fills the remaining width

#### Scenario: Narrow layout opens Explorer as temporary drawer
- **WHEN** the viewport width is less than 768px and the operator clicks the Home icon in the Activity Bar
- **THEN** the Explorer content opens in a temporary drawer or sheet
- **AND** the ACTIVE CHANGES section is expanded in that temporary surface
- **AND** closing the drawer returns the layout to Activity Bar + Main Viewer only

### Requirement: Layout uses shadcn-svelte Resizable component
The system SHALL use the shadcn-svelte `Resizable` component for the pane divider implementation in the persistent desktop layout, and a shadcn-svelte `Sheet` (or equivalent overlay surface) for temporary Explorer access in narrow mode.

#### Scenario: Resizable component integration
- **WHEN** the layout renders
- **THEN** the shadcn-svelte `Resizable` component is used for the Explorer/Main Viewer split
- **AND** the resize handle matches the shadcn-svelte styling
