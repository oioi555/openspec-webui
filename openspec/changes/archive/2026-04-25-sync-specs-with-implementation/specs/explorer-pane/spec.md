# explorer-pane Delta Specification

## MODIFIED Requirements

### Requirement: Explorer Pane renders collapsible sections
The system SHALL render an Explorer Pane between the Activity Bar and the Main Viewer. The Explorer Pane SHALL use the `ExplorerSection` component for each of its three sections (ACTIVE CHANGES, ARCHIVE, SPECS). Each section SHALL pass its title, item count, collapse state, focused state, and header icon as props, and SHALL render section-specific content via slots. The ACTIVE CHANGES section SHALL use the `headerExtra` slot to render `CommandShortcutBar` when workspace commands are available. Explorer list items SHALL NOT render leading per-item icons on the first line. No inline collapsible section header markup SHALL remain in `ExplorerPane.svelte` outside of the `ExplorerSection` component usage. Each list item SHALL use the `ExplorerItem` component, which internally uses `ItemContextMenu` to provide context menu actions and handles click interactions. Each section SHALL pass `emptyMessage` props to `ExplorerSection` to handle empty states internally; the `emptyIcon` is determined internally by each ExplorerSection component reusing its section header icon.

#### Scenario: Explorer Pane uses ExplorerSection for ACTIVE CHANGES
- **WHEN** the Explorer Pane renders the ACTIVE CHANGES section
- **THEN** it renders an ExplorerSection with `title="Active Changes"`, `count` from the active changes store, and `open` from the layout store
- **AND** the section header icon is shown by the ExplorerSection component
- **AND** the `headerExtra` slot includes the CommandShortcutBar when workspace commands exist
- **AND** the section passes `emptyMessage="No active changes"` to ExplorerSection
- **AND** the ExplorerSection internally reuses its section header icon as the empty icon
- **AND** the default slot renders ExplorerItem components for each active change
- **AND** each ExplorerItem shows a compact second line with Calendar+date, FileText+delta count, CircleCheckBig+task progress, and a narrow progress bar

#### Scenario: Explorer Pane uses ExplorerSection for ARCHIVE
- **WHEN** the Explorer Pane renders the ARCHIVE section
- **THEN** it renders an ExplorerSection with `title="Archive"`, `count` from the archived changes store
- **AND** the section header icon is shown by the ExplorerSection component
- **AND** the section passes `emptyMessage="No archived changes"` to ExplorerSection
- **AND** the ExplorerSection internally reuses its section header icon as the empty icon
- **AND** the default slot renders ExplorerItem components for each archived change
- **AND** each archived change name has the date prefix stripped in the visible label while preserving the full name in the tooltip
- **AND** each ExplorerItem shows a compact second line with Calendar+date, FileText+delta count, CircleCheckBig+task progress, with no progress bar

#### Scenario: Explorer Pane uses ExplorerSection for SPECS
- **WHEN** the Explorer Pane renders the SPECS section
- **THEN** it renders an ExplorerSection with `title="Specs"`, `count` from the specs store
- **AND** the section header icon is shown by the ExplorerSection component
- **AND** the section passes `emptyMessage="No specs found"` to ExplorerSection
- **AND** the ExplorerSection internally reuses its section header icon as the empty icon
- **AND** the default slot renders ExplorerItem components for each spec
- **AND** each ExplorerItem shows a Calendar icon and last modification date on the second line
- **AND** no design-specific badge or marker is shown for spec entries

#### Scenario: Empty section displays placeholder via ExplorerSection
- **WHEN** a section has no items
- **THEN** the ExplorerSection internally shows an EmptyState with the provided `emptyMessage` and its section header icon reused as the empty icon
- **AND** no separate `{#if}` empty state check exists in ExplorerPane for that section

#### Scenario: No independent list item icons remain
- **WHEN** `ExplorerPane.svelte` is inspected
- **THEN** no `IconBox` or other decorative icon is rendered inside ExplorerPane list items

#### Scenario: No inline section header markup in ExplorerPane
- **WHEN** `ExplorerPane.svelte` is inspected
- **THEN** no `<Collapsible.Root>` with inline header classes exists outside of the `ExplorerSection` component

#### Scenario: Explorer list items use ExplorerItem
- **WHEN** `ExplorerPane.svelte` is inspected
- **THEN** no inline `ContextMenu.Root` usage exists
- **AND** no inline `ItemContextMenu` usage exists
- **AND** each list item uses the `ExplorerItem` component

#### Scenario: No click handler helpers in ExplorerPane
- **WHEN** `ExplorerPane.svelte` is inspected
- **THEN** no `handleItemClick`, `itemClass`, `openItemPreview`, or `openItemConfirmed` function definitions exist
- **AND** these concerns are handled internally by ExplorerItem

### Requirement: Explorer Pane renders current-project footer content
When the Explorer Pane is visible, the system SHALL render current-project identity content at the bottom of the pane. The footer SHALL display a folder icon and a "Current Project" label, SHALL display the active project name inside an interactive card, and SHALL provide a `folder-pen` button on the card that opens the project selector. The footer SHALL NOT render a project avatar or project appearance editor affordance. In narrow layout, the drawer SHALL open to the right of the Activity Bar so the rail remains visible.

#### Scenario: Explorer Pane shows project footer content
- **WHEN** the Explorer Pane is visible with an active project
- **THEN** the bottom section of the pane displays a folder icon and "Current Project" label
- **AND** below the label, an interactive card shows the active project name with a `folder-pen` icon

#### Scenario: ExplorerPane selector card opens selector
- **WHEN** the operator clicks the interactive project card in the current-project footer
- **THEN** the project selector opens
- **AND** the collapse state of the Explorer Pane does not change

#### Scenario: Narrow drawer keeps the Activity Bar visible
- **WHEN** the application is in narrow layout (viewport width 960px or less) and the operator opens the Explorer drawer
- **THEN** the drawer appears to the right of the 48px Activity Bar
- **AND** the Activity Bar remains visible and interactive

### Requirement: Explorer Pane is collapsible
The system SHALL allow the operator to collapse the entire Explorer Pane by clicking the currently active Activity Bar section icon or the dedicated Explorer toggle control. When collapsed, the Activity Bar icon for the current section SHALL still be highlighted, the Explorer toggle SHALL remain visible at the bottom of the Activity Bar, and the Main Viewer SHALL expand to fill the space. The system SHALL NOT render an independent expand button when the Explorer Pane is collapsed.

#### Scenario: Collapse entire Explorer Pane via Activity Bar toggle
- **WHEN** the operator clicks the currently active icon in the Activity Bar while the Explorer Pane is expanded
- **THEN** the Explorer Pane collapses to zero width
- **AND** the Main Viewer expands to fill the space
- **AND** the active Activity Bar icon remains highlighted
- **AND** the Explorer toggle remains visible at the bottom of the Activity Bar

#### Scenario: Expand collapsed Explorer Pane via Activity Bar
- **WHEN** the operator clicks any Activity Bar section icon while the Explorer Pane is collapsed
- **THEN** the Explorer Pane expands back to its previous width
- **AND** the corresponding section is expanded and focused
- **AND** the current-project footer content is rendered again

#### Scenario: No independent expand button when collapsed
- **WHEN** the Explorer Pane is collapsed
- **THEN** no expand button is rendered in the Main Viewer area
- **AND** the Main Viewer fills the available space without any explorer-related controls
