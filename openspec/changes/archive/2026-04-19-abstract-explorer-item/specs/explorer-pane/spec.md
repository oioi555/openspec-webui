## MODIFIED Requirements

### Requirement: Explorer Pane renders collapsible sections
The system SHALL render an Explorer Pane between the Activity Bar and the Main Viewer. The Explorer Pane SHALL use the `ExplorerSection` component for each of its three sections (ACTIVE CHANGES, ARCHIVE, SPECS). Each section SHALL pass its title, item count, collapse state, focused state, and header icon as props, and SHALL render section-specific content via slots. The ACTIVE CHANGES section SHALL use the `headerExtra` slot to render `CommandShortcutBar` when workspace commands are available. Explorer list items SHALL NOT render leading per-item icons on the first line. No inline collapsible section header markup SHALL remain in `ExplorerPane.svelte` outside of the `ExplorerSection` component usage. Each list item SHALL use the `ExplorerItem` component, which internally uses `ItemContextMenu` to provide context menu actions and handles click interactions. Each section SHALL pass `emptyMessage` and `emptyIcon` props to `ExplorerSection` to handle empty states internally.

#### Scenario: Explorer Pane uses ExplorerSection for ACTIVE CHANGES
- **WHEN** the Explorer Pane renders the ACTIVE CHANGES section
- **THEN** it renders an ExplorerSection with `title="Active Changes"`, `count` from the active changes store, and `open` from the layout store
- **AND** the section header icon is shown by the ExplorerSection component
- **AND** the `headerExtra` slot includes the CommandShortcutBar when workspace commands exist
- **AND** the section passes `emptyMessage="No active changes"` and `emptyIcon={SquarePen}` to ExplorerSection
- **AND** the default slot renders ExplorerItem components for each active change
- **AND** each ExplorerItem shows a compact second line with Calendar+date, FileText+delta count, CircleCheckBig+task progress, and a narrow progress bar

#### Scenario: Explorer Pane uses ExplorerSection for ARCHIVE
- **WHEN** the Explorer Pane renders the ARCHIVE section
- **THEN** it renders an ExplorerSection with `title="Archive"`, `count` from the archived changes store
- **AND** the section header icon is shown by the ExplorerSection component
- **AND** the section passes `emptyMessage="No archived changes"` and `emptyIcon={Archive}` to ExplorerSection
- **AND** the default slot renders ExplorerItem components for each archived change
- **AND** each archived change name has the date prefix stripped in the visible label while preserving the full name in the tooltip
- **AND** each ExplorerItem shows a compact second line with Calendar+date, FileText+delta count, CircleCheckBig+task progress, with no progress bar

#### Scenario: Explorer Pane uses ExplorerSection for SPECS
- **WHEN** the Explorer Pane renders the SPECS section
- **THEN** it renders an ExplorerSection with `title="Specs"`, `count` from the specs store
- **AND** the section header icon is shown by the ExplorerSection component
- **AND** the section passes `emptyMessage="No specs found"` and `emptyIcon={FileText}` to ExplorerSection
- **AND** the default slot renders ExplorerItem components for each spec
- **AND** each ExplorerItem shows a Calendar icon and last modification date on the second line
- **AND** a Design badge may appear on the right when `design.md` is present

#### Scenario: Empty section displays placeholder via ExplorerSection
- **WHEN** a section has no items
- **THEN** the ExplorerSection internally shows an EmptyState with the provided `emptyMessage` and `emptyIcon`
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
