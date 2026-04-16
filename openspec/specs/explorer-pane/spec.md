# explorer-pane Specification

## Purpose
Define the Explorer Pane that organizes active changes, archives, and specs beside the Activity Bar.

## Requirements
### Requirement: Explorer Pane renders collapsible sections
The system SHALL render an Explorer Pane between the Activity Bar and the Main Viewer. The Explorer Pane SHALL use the `ExplorerSection` component for each of its three sections (ACTIVE CHANGES, ARCHIVE, SPECS). Each section SHALL pass its title, item count, collapse state, focused state, and header icon as props, and SHALL render section-specific content via slots. The ACTIVE CHANGES section SHALL use the `headerExtra` slot to render `CommandShortcutBar` when workspace commands are available. Explorer list items SHALL NOT render leading per-item icons on the first line. No inline collapsible section header markup SHALL remain in `ExplorerPane.svelte` outside of the `ExplorerSection` component usage. Each list item (active change, archived change, spec) SHALL use the `ItemContextMenu` component to provide context menu actions, replacing inline `ContextMenu.Root` usage.

#### Scenario: Explorer Pane uses ExplorerSection for ACTIVE CHANGES
- **WHEN** the Explorer Pane renders the ACTIVE CHANGES section
- **THEN** it renders an ExplorerSection with `title="ACTIVE CHANGES"`, `count` from the active changes store, and `open` from the layout store
- **AND** the section header icon is shown by the ExplorerSection component
- **AND** the `headerExtra` slot includes the CommandShortcutBar when workspace commands exist
- **AND** the default slot includes the active changes list or empty state
- **AND** each list item shows a compact second line with Calendar+date, FileText+delta count, CheckSquare+task progress, and a narrow progress bar

#### Scenario: Explorer Pane uses ExplorerSection for ARCHIVE
- **WHEN** the Explorer Pane renders the ARCHIVE section
- **THEN** it renders an ExplorerSection with `title="ARCHIVE"`, `count` from the archived changes store
- **AND** the section header icon is shown by the ExplorerSection component
- **AND** the default slot includes the archived changes list or empty state
- **AND** each archived change name has the date prefix stripped in the visible label while preserving the full name in the tooltip
- **AND** each list item shows a compact second line with Calendar+date, FileText+delta count, CheckSquare+task progress, with no progress bar

#### Scenario: Explorer Pane uses ExplorerSection for SPECS
- **WHEN** the Explorer Pane renders the SPECS section
- **THEN** it renders an ExplorerSection with `title="SPECS"`, `count` from the specs store
- **AND** the section header icon is shown by the ExplorerSection component
- **AND** the default slot includes the specs list or empty state
- **AND** each spec shows a Calendar icon and last modification date (YYYY-MM-DD) on the second line
- **AND** a Design badge may appear on the right when `design.md` is present

#### Scenario: Empty section displays placeholder
- **WHEN** a section has no items
- **THEN** the section body shows a placeholder message (e.g., `No active changes`)

#### Scenario: No independent list item icons remain
- **WHEN** `ExplorerPane.svelte` is inspected
- **THEN** no `IconBox` or other decorative icon is rendered inside ExplorerPane list items

#### Scenario: No inline section header markup in ExplorerPane
- **WHEN** `ExplorerPane.svelte` is inspected
- **THEN** no `<Collapsible.Root>` with inline header classes (`border-b border-border/70 bg-secondary/40`) exists outside of the `ExplorerSection` component

#### Scenario: Explorer list items use ItemContextMenu
- **WHEN** `ExplorerPane.svelte` is inspected
- **THEN** no inline `ContextMenu.Root` usage exists
- **AND** each list item uses the `ItemContextMenu` component to provide context menu actions

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
The system SHALL synchronize Activity Bar selection with Explorer Pane expansion presets. Selecting Home from the Activity Bar SHALL expand ACTIVE CHANGES and collapse ARCHIVE and SPECS. Selecting Archive from the Activity Bar SHALL expand ARCHIVE and collapse ACTIVE CHANGES and SPECS. Selecting Specs from the Activity Bar SHALL expand SPECS and collapse ACTIVE CHANGES and ARCHIVE. Manual section toggles inside the Explorer Pane SHALL remain allowed until the next Activity Bar preset change.

#### Scenario: Home preset expands active changes browsing
- **WHEN** the operator clicks the Home icon in the Activity Bar
- **THEN** the ACTIVE CHANGES section is expanded
- **AND** the ARCHIVE section is collapsed
- **AND** the SPECS section is collapsed

#### Scenario: Archive preset expands archive browsing
- **WHEN** the operator clicks the Archive icon in the Activity Bar
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
The system SHALL allow the operator to resize the Explorer Pane width by dragging the right border. The Explorer Pane SHALL have a minimum width of 180px and a maximum width of 600px.

#### Scenario: Resize Explorer Pane
- **WHEN** the operator drags the right border of the Explorer Pane
- **THEN** the pane width changes following the cursor
- **AND** the width stays within the 180px-600px range

### Requirement: Explorer Pane renders current-project header content
When the Explorer Pane is visible, the system SHALL render current-project header content within the pane header itself. The header SHALL display a folder icon, SHALL display the active project name, and SHALL provide a `folder-pen` button that opens the project selector. The header SHALL NOT render a project avatar or project appearance editor affordance. In narrow layout, the drawer SHALL open to the right of the Activity Bar so the rail remains visible.

#### Scenario: Explorer Pane shows project header content
- **WHEN** the Explorer Pane is visible with an active project
- **THEN** the top row of the pane displays a folder icon and the active project name together
- **AND** the row includes a `folder-pen` project selector button

#### Scenario: ExplorerPane selector button opens selector
- **WHEN** the operator activates the `folder-pen` button in the current-project header
- **THEN** the project selector opens
- **AND** the collapse state of the Explorer Pane does not change

#### Scenario: Narrow drawer keeps the Activity Bar visible
- **WHEN** the application is in narrow layout (viewport width 960px or less) and the operator opens the Explorer drawer
- **THEN** the drawer appears to the right of the 48px Activity Bar
- **AND** the Activity Bar remains visible and interactive

### Requirement: Explorer Pane is collapsible
The system SHALL allow the operator to collapse the entire Explorer Pane by clicking the currently active Activity Bar section icon or the dedicated Explorer toggle control. When collapsed, the Activity Bar icon for the current section SHALL still be highlighted, the Explorer toggle SHALL remain visible at the top of the Activity Bar, and the Main Viewer SHALL expand to fill the space. The system SHALL NOT render an independent expand button when the Explorer Pane is collapsed.

#### Scenario: Collapse entire Explorer Pane via Activity Bar toggle
- **WHEN** the operator clicks the currently active icon in the Activity Bar while the Explorer Pane is expanded
- **THEN** the Explorer Pane collapses to zero width
- **AND** the Main Viewer expands to fill the space
- **AND** the active Activity Bar icon remains highlighted
- **AND** the Explorer toggle remains visible at the top of the Activity Bar

#### Scenario: Expand collapsed Explorer Pane via Activity Bar
- **WHEN** the operator clicks any Activity Bar section icon while the Explorer Pane is collapsed
- **THEN** the Explorer Pane expands back to its previous width
- **AND** the corresponding section is expanded and focused
- **AND** the current-project header content is rendered again

#### Scenario: No independent expand button when collapsed
- **WHEN** the Explorer Pane is collapsed
- **THEN** no expand button is rendered in the Main Viewer area
- **AND** the Main Viewer fills the available space without any explorer-related controls
