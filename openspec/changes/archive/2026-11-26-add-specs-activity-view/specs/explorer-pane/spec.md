# Spec Delta

## MODIFIED Requirements

### Requirement: Explorer Pane renders collapsible sections
The system SHALL render an Explorer Pane between the Activity Bar and the Main Viewer, using the `ExplorerSection` component for each of its two default sections (ACTIVE CHANGES, ARCHIVE), passing its props (including `emptyMessage`) and rendering section content via slots. Each section header SHALL render a `Date` / `Name` sort control. Each list item SHALL use `ExplorerSectionItem`, and `ExplorerPane.svelte` SHALL keep no inline collapsible section header markup.

#### Scenario: Explorer Pane uses ExplorerSection for ACTIVE CHANGES
- **WHEN** the Explorer Pane renders the ACTIVE CHANGES section
- **THEN** it renders an ExplorerSection with `title="Active Changes"`, `count` from the active changes store, and `open` from the layout store
- **AND** the section header icon is shown by the ExplorerSection component
- **AND** the `headerExtra` slot includes the CommandShortcutBar when workspace commands exist
- **AND** the section header includes a sort control with `Date` and `Name` options
- **AND** the section passes `emptyMessage="No active changes"` to ExplorerSection
- **AND** the ExplorerSection internally reuses its section header icon as the empty icon
- **AND** the default slot renders `ExplorerSectionItem` components for each active change
- **AND** each `ExplorerSectionItem` shows a compact second line with Calendar+date, FileText+delta count, CircleCheckBig+task progress, and a narrow progress bar

#### Scenario: Explorer list items have no leading icons
- **WHEN** any Explorer section renders its list items
- **THEN** no leading per-item icon is rendered on the first line
- **AND** each `ExplorerSectionItem` internally uses `ItemContextMenu` for context menu actions and handles click interactions
- **AND** `ExplorerPane.svelte` has no inline collapsible section header markup outside of `ExplorerSection` usage
- **AND** each section passes its title, item count, collapse state, focused state, and header icon as props

#### Scenario: Explorer Pane uses ExplorerSection for ARCHIVE
- **WHEN** the Explorer Pane renders the ARCHIVE section
- **THEN** it renders an ExplorerSection with `title="Archive"`, `count` from the archived changes store
- **AND** the section header icon is shown by the ExplorerSection component
- **AND** the section header includes a sort control with `Date` and `Name` options
- **AND** the section passes `emptyMessage="No archived changes"` to ExplorerSection
- **AND** the ExplorerSection internally reuses its section header icon as the empty icon
- **AND** the default slot renders `ExplorerSectionItem` components for each archived change
- **AND** each archived change name has the date prefix stripped in the visible label while preserving the full name in the tooltip
- **AND** each `ExplorerSectionItem` shows a compact second line with Calendar+date, FileText+delta count, CircleCheckBig+task progress, with no progress bar

#### Scenario: Explorer Pane uses ExplorerSection for SPECS
- **WHEN** the Explorer Pane renders its default section group
- **THEN** it renders only the ACTIVE CHANGES and ARCHIVE sections, with no SPECS ExplorerSection
- **AND** specs are browsed in the dedicated Specs panel instead

#### Scenario: Explorer sorting uses shared sorting base
- **WHEN** an explorer section sorts items by Date or Name
- **THEN** the ordering behavior is provided by the shared sorting base used by dashboard sorting
- **AND** the ACTIVE CHANGES and ARCHIVE sections still default to Date sorting

### Requirement: Default Explorer sections use flush list layout
The Explorer Pane default section group SHALL render Active Changes and Archive as adjacent flush full-width list sections instead of separated rounded card containers, without large outer padding or large inter-section gaps, so list items gain horizontal space like Search and Validation rows. Each section SHALL keep its existing header controls and item behavior. Section boundaries and programmatic section focus SHALL stay visually clear without a card-wide rounded focus ring.

#### Scenario: Default Explorer uses adjacent full-width sections
- **WHEN** the Explorer Pane displays the default Active Changes and Archive group
- **THEN** the sections render as a contiguous flush list surface rather than as separated rounded cards
- **AND** there is no large vertical gap between adjacent section containers
- **AND** list rows can use the available Explorer Pane width without extra card-stack inset padding
- **AND** Explorer list items gain horizontal space comparable to Search and Validation panel rows

#### Scenario: Section controls remain available in flush layout
- **WHEN** the default Explorer section group is rendered in the flush layout
- **THEN** each section header still displays its title, icon, count, chevron, and collapse/expand control
- **AND** each section keeps its existing empty-state behavior
- **AND** Active Changes and Archive still display their sort controls where currently supported
- **AND** Active Changes still displays workspace command shortcuts when available

#### Scenario: Flush layout preserves section wayfinding
- **WHEN** multiple default Explorer sections are expanded next to each other
- **THEN** section headers and separators make the boundary between Active Changes and Archive visually clear
- **AND** the boundary may use full-width header styling, separators, or an equivalent flush-list-friendly treatment
- **AND** a programmatically focused section has a visible focused state suitable for a flush list layout
- **AND** that focused state does not require a card-wide rounded focus ring

#### Scenario: Existing item behavior is unchanged
- **WHEN** the operator selects, previews, confirms, or opens the context menu for an Active Changes or Archive row
- **THEN** the row behavior matches the existing Explorer item behavior
- **AND** inline validation icons, date/spec/task metadata, progress display, and archived-change display names remain unchanged

#### Scenario: Search and Validation panels are not redesigned
- **WHEN** the Explorer Pane switches to Search, Validation, or Specs mode
- **THEN** those dedicated panels retain their existing header and list structure
- **AND** the default-section flush layout changes do not introduce additional card wrappers or spacing into those panels

### Requirement: Explorer sections are collapsible
The system SHALL allow each Explorer Pane section to be collapsed and expanded independently. The collapsed/expanded state SHALL be preserved during the current session.

#### Scenario: Collapse a section
- **WHEN** the operator clicks the ACTIVE CHANGES section header
- **THEN** the ACTIVE CHANGES section body collapses to show only the header
- **AND** the ARCHIVE section remains in its current state

#### Scenario: Expand a collapsed section
- **WHEN** the operator clicks a collapsed section header
- **THEN** the section expands to show its items

#### Scenario: Both default sections start expanded
- **WHEN** the Explorer Pane renders the default section group with no saved section state
- **THEN** the ACTIVE CHANGES and ARCHIVE sections are both expanded

### Requirement: Activity Bar selection applies explorer focus presets
The system SHALL synchronize Activity Bar selection with Explorer Pane expansion presets: Home SHALL expand both ACTIVE CHANGES and ARCHIVE, Archive SHALL expand ARCHIVE and collapse ACTIVE CHANGES, and Specs, Search, and Validate SHALL show the Specs, Search, and Validation panels. Manual section toggles inside the Explorer Pane SHALL remain allowed until the next Activity Bar preset change.

#### Scenario: Home preset expands active changes browsing
- **WHEN** the operator clicks the Home icon in the Activity Bar
- **THEN** the ACTIVE CHANGES section is expanded
- **AND** the ARCHIVE section is expanded below it

#### Scenario: Archive preset expands archive browsing
- **WHEN** the operator clicks the Archive icon in the Activity Bar
- **THEN** the ARCHIVE section is expanded
- **AND** the ACTIVE CHANGES section is collapsed

#### Scenario: Specs preset expands only spec browsing
- **WHEN** the operator clicks the Specs icon in the Activity Bar
- **THEN** the Explorer Pane switches to the Specs panel

#### Scenario: Search preset shows Search panel
- **WHEN** the operator clicks the Search icon in the Activity Bar
- **THEN** the Explorer Pane switches to the Search panel

#### Scenario: Validate preset shows Validation panel
- **WHEN** the operator clicks the Validate icon in the Activity Bar
- **THEN** the Explorer Pane switches to the Validation panel

#### Scenario: Opening a tab does not switch panels
- **WHEN** a spec tab or a change tab becomes active while the Specs, Search, or Validation panel is shown
- **THEN** the Explorer Pane keeps showing that panel
- **AND** a spec tab becoming active while the default section group is shown does not switch to the Specs panel

#### Scenario: Activity Bar can restore a collapsed pane
- **WHEN** the Explorer Pane is collapsed and the operator clicks the Home icon in the Activity Bar
- **THEN** the Explorer Pane expands back to its previous width
- **AND** the ACTIVE CHANGES section is expanded

#### Scenario: Manual toggles persist until the next preset
- **WHEN** the operator applies the Home preset and then manually collapses the ARCHIVE section
- **THEN** the ARCHIVE section stays collapsed
- **AND** the next Activity Bar preset change reapplies that preset's expansion state

### Requirement: Explorer items open tabs in main viewer
The system SHALL open a new tab (or focus an existing one) in the Main Viewer when the operator clicks an item in the Explorer Pane. Clicking a spec item SHALL open that spec's detail view. Clicking a change item SHALL open that change's detail view.

#### Scenario: Click a spec item to open tab
- **WHEN** the operator clicks a spec named `authentication` in the Specs panel
- **THEN** a tab with type `spec` and name `authentication` is opened or focused in the Main Viewer
- **AND** the spec content is rendered in the tab

#### Scenario: Click an already-open item
- **WHEN** the operator clicks a spec that is already open in a tab
- **THEN** the existing tab is focused
- **AND** no duplicate tab is created

### Requirement: Explorer Pane renders a persistent Search panel
The system SHALL render Search as a dedicated Explorer Pane panel separate from the Active Changes and Archive section group, shown alone above the project selector footer when active. It SHALL follow the Explorer visual language with a larger fixed header, search input, and persistent result list, and SHALL show result counts, loading state, short-query guidance, empty results, and a clear control as appropriate. State explanations SHALL render in the list area, not as header prose.

#### Scenario: Search panel initial state
- **WHEN** the Explorer Pane is switched to Search and no search query has been entered
- **THEN** the Search panel displays a prominent Search header
- **AND** only the Search panel is shown above the existing project selector footer, following the Explorer visual language
- **AND** it displays a search input
- **AND** the list area displays a localized placeholder explaining the search scope and minimum-query guidance

#### Scenario: Search panel no-results placeholder
- **WHEN** a valid search query returns no matches
- **THEN** the Search panel displays a no-results placeholder in the list area
- **AND** the placeholder includes localized explanatory text for the current query state
- **AND** the sticky header does not repeat that explanation as persistent prose

#### Scenario: Search panel result list
- **WHEN** a valid search query returns matches
- **THEN** the Search panel displays the number of matches
- **AND** it renders each result as a selectable Explorer-style list item with shared type semantics, name, and preview text
- **AND** archived change results are visually distinguishable from active change results when a change result can be resolved to either state
- **AND** result rows use shared entity visual semantics

#### Scenario: Search panel short-query and loading states
- **WHEN** the entered query is too short, or a valid search is running
- **THEN** the list area shows short-query guidance as placeholder content, or the panel shows a loading state
- **AND** a clear control is shown when a query is present

#### Scenario: Search header remains visible while results scroll
- **WHEN** the operator scrolls a long Search result list
- **THEN** the Search header, current query, status, and clear control remain visible at the top of the Search panel
- **AND** only the result list scrolls
