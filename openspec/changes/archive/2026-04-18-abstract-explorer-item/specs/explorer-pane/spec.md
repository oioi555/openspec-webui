## MODIFIED Requirements

### Requirement: Explorer Pane renders collapsible sections
The system SHALL render an Explorer Pane between the Activity Bar and the Main Viewer. `ExplorerPane.svelte` SHALL compose the three fixed wrapper components from `$lib/components/shared/explorer-section`: `ActiveChangesExplorerSection`, `ArchiveExplorerSection`, and `SpecsExplorerSection`. Each wrapper SHALL internally render `ExplorerSection` and the shared internal `ExplorerSectionItem` helper for its list items. The ACTIVE CHANGES wrapper SHALL accept `headerExtra` to render `CommandShortcutBar` when workspace commands are available. Explorer list items SHALL NOT render leading per-item icons on the first line. No inline collapsible section header markup, direct `ItemContextMenu`, direct per-item `<button>`, or direct item-loop markup for these three sections SHALL remain in `ExplorerPane.svelte`.

#### Scenario: Explorer Pane uses ActiveChangesExplorerSection for Active Changes
- **WHEN** the Explorer Pane renders the ACTIVE CHANGES section
- **THEN** it renders `ActiveChangesExplorerSection` with `changes` from the active changes store
- **AND** the wrapper internally renders `ExplorerSection` with `title="Active Changes"`, `section="active-changes"`, and `emptyMessage="No active changes"`
- **AND** the `headerExtra` slot includes the CommandShortcutBar when workspace commands exist
- **AND** the wrapper internally renders active changes list items via `ExplorerSectionItem`
- **AND** each list item shows a compact second line with Calendar+date, FileText+delta count, CircleCheckBig+task progress, and a narrow progress bar

#### Scenario: Explorer Pane uses ArchiveExplorerSection for Archive
- **WHEN** the Explorer Pane renders the ARCHIVE section
- **THEN** it renders `ArchiveExplorerSection` with `changes` from the archived changes store
- **AND** the wrapper internally renders `ExplorerSection` with `title="Archive"`, `section="archive"`, and `emptyMessage="No archived changes"`
- **AND** the wrapper internally renders archived changes list items via `ExplorerSectionItem`
- **AND** each archived change name has the date prefix stripped in the visible label while preserving the full name in the tooltip
- **AND** each list item shows a compact second line with Calendar+date, FileText+delta count, CircleCheckBig+task progress, with no progress bar

#### Scenario: Explorer Pane uses SpecsExplorerSection for Specs
- **WHEN** the Explorer Pane renders the SPECS section
- **THEN** it renders `SpecsExplorerSection` with `specs` from the specs store
- **AND** the wrapper internally renders `ExplorerSection` with `title="Specs"`, `section="specs"`, and `emptyMessage="No specs found"`
- **AND** the wrapper internally renders spec list items via `ExplorerSectionItem`
- **AND** each spec shows a Calendar icon and last modification date (YYYY-MM-DD) on the second line
- **AND** a Design badge may appear on the right when `design.md` is present

#### Scenario: Empty section displays placeholder via wrapper and ExplorerSection
- **WHEN** a section has no items (count === 0)
- **THEN** the wrapper's internal `ExplorerSection` shows the EmptyState with the provided emptyMessage
- **AND** no children are rendered

#### Scenario: No independent list item icons remain
- **WHEN** `ExplorerPane.svelte` is inspected
- **THEN** no `IconBox` or other decorative icon is rendered inside ExplorerPane list items

#### Scenario: No inline section header markup in ExplorerPane
- **WHEN** `ExplorerPane.svelte` is inspected
- **THEN** no `<Collapsible.Root>` with inline header classes (`border-b border-border/70 bg-secondary/40`) exists there
- **AND** the three explorer sections are rendered only through the wrapper components

#### Scenario: ExplorerPane has no direct list item markup
- **WHEN** `ExplorerPane.svelte` is inspected
- **THEN** no direct `ItemContextMenu` usage exists
- **AND** no direct `<button>` for list items exists
- **AND** no direct `{#each}` block renders explorer list items there
- **AND** each list item is rendered inside the wrapper components via `ExplorerSectionItem`
