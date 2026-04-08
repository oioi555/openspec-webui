# explorer-pane Specification

## Purpose
Define the Explorer Pane that organizes active changes, archives, and specs beside the Activity Bar.

## Requirements
### Requirement: Explorer Pane renders collapsible sections
The system SHALL render an Explorer Pane between the Activity Bar and the Main Viewer. The Explorer Pane SHALL contain three collapsible sections in this order: ACTIVE CHANGES, ARCHIVE, and SPECS. Each section SHALL display a header with a count badge and a list of items, and all section headers SHALL remain visible together so the operator can scan the full list structure.

#### Scenario: Explorer Pane shows three sections on load
- **WHEN** the application loads with data
- **THEN** the Explorer Pane shows three collapsible sections in order: ACTIVE CHANGES, ARCHIVE, SPECS
- **AND** each section header shows a count badge with the number of items

#### Scenario: Empty section displays placeholder
- **WHEN** a section has no items
- **THEN** the section body shows a placeholder message (e.g., `No active changes`)

### Requirement: Explorer sections are collapsible
The system SHALL allow each Explorer Pane section to be collapsed and expanded independently. The collapsed/expanded state SHALL be preserved during the current session.

#### Scenario: Collapse a section
- **WHEN** the operator clicks the ACTIVE CHANGES section header
- **THEN** the ACTIVE CHANGES section body collapses to show only the header
- **AND** the ARCHIVE and SPECS sections remain in their current state

#### Scenario: Expand a collapsed section
- **WHEN** the operator clicks a collapsed section header
- **THEN** the section expands to show its items

### Requirement: Activity Bar selection applies explorer focus presets
The system SHALL synchronize Activity Bar selection with Explorer Pane expansion presets. Selecting Home from the Activity Bar SHALL expand ACTIVE CHANGES and collapse ARCHIVE and SPECS. Selecting Changes from the Activity Bar SHALL expand ARCHIVE and collapse ACTIVE CHANGES and SPECS. Selecting Specs from the Activity Bar SHALL expand SPECS and collapse ACTIVE CHANGES and ARCHIVE. Manual section toggles inside the Explorer Pane SHALL remain allowed until the next Activity Bar preset change.

#### Scenario: Home preset expands active changes browsing
- **WHEN** the operator clicks the Home icon in the Activity Bar
- **THEN** the ACTIVE CHANGES section is expanded
- **AND** the ARCHIVE section is collapsed
- **AND** the SPECS section is collapsed

#### Scenario: Changes preset expands archive browsing
- **WHEN** the operator clicks the Changes icon in the Activity Bar
- **THEN** the ARCHIVE section is expanded
- **AND** the ACTIVE CHANGES section is collapsed
- **AND** the SPECS section is collapsed

#### Scenario: Specs preset expands only spec browsing
- **WHEN** the operator clicks the Specs icon in the Activity Bar
- **THEN** the SPECS section is expanded
- **AND** the ACTIVE CHANGES section is collapsed
- **AND** the ARCHIVE section is collapsed

#### Scenario: Activity Bar can restore a collapsed pane
- **WHEN** the Explorer Pane is collapsed and the operator clicks the Home icon in the Activity Bar
- **THEN** the Explorer Pane expands back to its previous width
- **AND** the ACTIVE CHANGES section is expanded

### Requirement: Explorer items open tabs in main viewer
The system SHALL open a new tab (or focus an existing one) in the Main Viewer when the operator clicks an item in the Explorer Pane. Clicking a spec item SHALL open that spec's detail view. Clicking a change item SHALL open that change's detail view.

#### Scenario: Click a spec item to open tab
- **WHEN** the operator clicks a spec named `authentication` in the SPECS section
- **THEN** a tab with type `spec` and name `authentication` is opened or focused in the Main Viewer
- **AND** the spec content is rendered in the tab

#### Scenario: Click an already-open item
- **WHEN** the operator clicks a spec that is already open in a tab
- **THEN** the existing tab is focused
- **AND** no duplicate tab is created

### Requirement: Explorer Pane is resizable
The system SHALL allow the operator to resize the Explorer Pane width by dragging the right border. The Explorer Pane SHALL have a minimum width of 180px and a maximum width of 400px.

#### Scenario: Resize Explorer Pane
- **WHEN** the operator drags the right border of the Explorer Pane
- **THEN** the pane width changes following the cursor
- **AND** the width stays within the 180px-400px range

### Requirement: Explorer Pane is collapsible
The system SHALL allow the operator to collapse the entire Explorer Pane. When collapsed, the Activity Bar icon for the current section SHALL still be highlighted and the Main Viewer SHALL expand to fill the space.

#### Scenario: Collapse entire Explorer Pane
- **WHEN** the operator toggles the Explorer Pane collapse control
- **THEN** the Explorer Pane collapses to zero width
- **AND** the Main Viewer expands to fill the space

#### Scenario: Expand collapsed Explorer Pane
- **WHEN** the operator toggles the Explorer Pane collapse control again
- **THEN** the Explorer Pane expands back to its previous width
