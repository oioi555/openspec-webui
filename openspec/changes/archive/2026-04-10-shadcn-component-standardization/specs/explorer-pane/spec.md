## MODIFIED Requirements

### Requirement: Explorer Pane renders collapsible sections
The system SHALL render an Explorer Pane between the Activity Bar and the Main Viewer. The Explorer Pane SHALL use the `ExplorerSection` component from `$lib/components/ui/explorer-section/` for each of its three sections (ACTIVE CHANGES, ARCHIVE, SPECS). Each section SHALL pass its title, item count, collapse state, focused state, and header icon as props, and SHALL render section-specific content via slots. The ACTIVE CHANGES section SHALL use the `headerExtra` slot to render `CommandShortcutBar` when workspace commands are available. Explorer list items SHALL NOT render individual icons. No inline collapsible section header markup SHALL remain in `ExplorerPane.svelte` outside of the `ExplorerSection` component usage.

#### Scenario: Explorer Pane uses ExplorerSection for ACTIVE CHANGES
- **WHEN** the Explorer Pane renders the ACTIVE CHANGES section
- **THEN** it renders an ExplorerSection with `title="ACTIVE CHANGES"`, `count` from the active changes store, and `open` from the layout store
- **AND** the section header icon is shown by the ExplorerSection component
- **AND** the `headerExtra` slot includes the CommandShortcutBar when workspace commands exist
- **AND** the default slot includes the active changes list or empty state
- **AND** the list items themselves do not show individual icons

#### Scenario: Explorer Pane uses ExplorerSection for ARCHIVE
- **WHEN** the Explorer Pane renders the ARCHIVE section
- **THEN** it renders an ExplorerSection with `title="ARCHIVE"`, `count` from the archived changes store
- **AND** the section header icon is shown by the ExplorerSection component
- **AND** the default slot includes the archived changes list or empty state

#### Scenario: Explorer Pane uses ExplorerSection for SPECS
- **WHEN** the Explorer Pane renders the SPECS section
- **THEN** it renders an ExplorerSection with `title="SPECS"`, `count` from the specs store
- **AND** the section header icon is shown by the ExplorerSection component
- **AND** the default slot includes the specs list or empty state

#### Scenario: No independent list item icons remain
- **WHEN** `ExplorerPane.svelte` is inspected
- **THEN** no `IconBox` or other decorative icon is rendered inside ExplorerPane list items

#### Scenario: No inline section header markup in ExplorerPane
- **WHEN** `ExplorerPane.svelte` is inspected
- **THEN** no `<Collapsible.Root>` with inline header classes (`border-b border-border/70 bg-secondary/40`) exists outside of the `ExplorerSection` component
