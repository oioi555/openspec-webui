## MODIFIED Requirements

### Requirement: Explorer Pane renders collapsible sections
The system SHALL render an Explorer Pane between the Activity Bar and the Main Viewer, using the `ExplorerSection` component for each of its three sections (ACTIVE CHANGES, ARCHIVE, SPECS), passing its props (including `emptyMessage`) and rendering section content via slots. Each section header SHALL render a `Date` / `Name` sort control. Each list item SHALL use `ExplorerSectionItem`, and `ExplorerPane.svelte` SHALL keep no inline collapsible section header markup.

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
- **WHEN** the Explorer Pane renders the SPECS section
- **THEN** it renders an ExplorerSection with `title="Specs"`, `count` from the specs store
- **AND** the section header icon is shown by the ExplorerSection component
- **AND** the section header includes a sort control with `Date` and `Name` options
- **AND** the section passes `emptyMessage="No specs found"` to ExplorerSection
- **AND** the ExplorerSection internally reuses its section header icon as the empty icon
- **AND** the default slot renders `ExplorerSectionItem` components for each spec
- **AND** each `ExplorerSectionItem` shows a Calendar icon and last modification datetime on the second line
- **AND** no design-specific badge or marker is shown for spec entries

#### Scenario: Explorer sorting uses shared sorting base
- **WHEN** an explorer section sorts items by Date or Name
- **THEN** the ordering behavior is provided by the shared sorting base used by dashboard sorting
- **AND** the ACTIVE CHANGES and ARCHIVE sections still default to Date sorting
- **AND** the SPECS section still defaults to Name sorting

### Requirement: Default Explorer sections use flush list layout
The Explorer Pane default section group SHALL render Active Changes, Archive, and Specs as adjacent flush full-width list sections instead of separated rounded card containers, without large outer padding or large inter-section gaps, so list items gain horizontal space like Search and Validation rows. Each section SHALL keep its existing header controls and item behavior. Section boundaries and programmatic section focus SHALL stay visually clear without a card-wide rounded focus ring.

#### Scenario: Default Explorer uses adjacent full-width sections
- **WHEN** the Explorer Pane displays the default Active Changes, Archive, and Specs group
- **THEN** the sections render as a contiguous flush list surface rather than as three separated rounded cards
- **AND** there is no large vertical gap between adjacent section containers
- **AND** list rows can use the available Explorer Pane width without extra card-stack inset padding
- **AND** Explorer list items gain horizontal space comparable to Search and Validation panel rows

#### Scenario: Section controls remain available in flush layout
- **WHEN** the default Explorer section group is rendered in the flush layout
- **THEN** each section header still displays its title, icon, count, chevron, and collapse/expand control
- **AND** each section keeps its existing empty-state behavior
- **AND** Active Changes, Archive, and Specs still display their sort controls where currently supported
- **AND** Active Changes still displays workspace command shortcuts when available

#### Scenario: Flush layout preserves section wayfinding
- **WHEN** multiple default Explorer sections are expanded next to each other
- **THEN** section headers and separators make the boundary between Active Changes, Archive, and Specs visually clear
- **AND** the boundary may use full-width header styling, separators, or an equivalent flush-list-friendly treatment
- **AND** a programmatically focused section has a visible focused state suitable for a flush list layout
- **AND** that focused state does not require a card-wide rounded focus ring

#### Scenario: Existing item behavior is unchanged
- **WHEN** the operator selects, previews, confirms, or opens the context menu for an Active Changes, Archive, or Specs row
- **THEN** the row behavior matches the existing Explorer item behavior
- **AND** inline validation icons, date/spec/task metadata, progress display, and archived-change display names remain unchanged

#### Scenario: Search and Validation panels are not redesigned
- **WHEN** the Explorer Pane switches to Search or Validation mode
- **THEN** those dedicated panels retain their existing header and list structure
- **AND** the default-section flush layout changes do not introduce additional card wrappers or spacing into those panels

### Requirement: Activity Bar selection applies explorer focus presets
The system SHALL synchronize Activity Bar selection with Explorer Pane expansion presets: Home, Archive, and Specs SHALL each expand their own section (ACTIVE CHANGES, ARCHIVE, SPECS) and collapse the other two, and Search and Validate SHALL show the Search and Validation panels. Manual section toggles inside the Explorer Pane SHALL remain allowed until the next Activity Bar preset change.

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

#### Scenario: Search preset shows Search panel
- **WHEN** the operator clicks the Search icon in the Activity Bar
- **THEN** the Explorer Pane switches to the Search panel

#### Scenario: Validate preset shows Validation panel
- **WHEN** the operator clicks the Validate icon in the Activity Bar
- **THEN** the Explorer Pane switches to the Validation panel

#### Scenario: Activity Bar can restore a collapsed pane
- **WHEN** the Explorer Pane is collapsed and the operator clicks the Home icon in the Activity Bar
- **THEN** the Explorer Pane expands back to its previous width
- **AND** the ACTIVE CHANGES section is expanded

#### Scenario: Manual toggles persist until the next preset
- **WHEN** the operator applies the Home preset and then manually expands the SPECS section
- **THEN** the SPECS section stays expanded
- **AND** the next Activity Bar preset change reapplies that preset's expansion state

### Requirement: Explorer Pane renders current-project footer content
When the Explorer Pane is visible, the system SHALL render current-project footer content at the bottom of the pane: a folder icon, a "Current Project" label, and an interactive card with the active project name and a `folder-pen` button that opens the project selector. The footer SHALL NOT render a project avatar or project appearance editor affordance. In narrow layout, the drawer SHALL open to the right of the Activity Bar so the rail remains visible.

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

### Requirement: Explorer Pane renders a persistent Search panel
The system SHALL render Search as a dedicated Explorer Pane panel separate from the Active Changes, Archive, and Specs section group, shown alone above the project selector footer when active. It SHALL follow the Explorer visual language with a larger fixed header, search input, and persistent result list, and SHALL show result counts, loading state, short-query guidance, empty results, and a clear control as appropriate. State explanations SHALL render in the list area, not as header prose.

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

### Requirement: Explorer Pane renders a persistent Validation panel
The system SHALL render Validation as a dedicated Explorer Pane panel separate from the section group, shown alone above the project selector footer when active. Its title row SHALL show the Validation title and a compact action opening Settings to the Validation section, and SHALL NOT show the result status badge. Before a result exists, explanation and a prominent Run Validate action SHALL live in the list placeholder; after one, a compact reload action and count filters SHALL appear.

#### Scenario: Validation panel initial state
- **WHEN** the Explorer Pane is switched to Validation and no validation result exists
- **THEN** the Validation panel displays a compact Validation header
- **AND** the title row includes a small settings action
- **AND** the title row does not include the post-run reload action before validation has run
- **AND** the title row does not display a validation status badge
- **AND** the list area displays an explanatory placeholder
- **AND** the placeholder displays a prominent text-labeled Run Validate action
- **AND** the header does not display file-status count filters before a result exists

#### Scenario: Validation panel layout constraints
- **WHEN** the Validation panel is shown
- **THEN** only the Validation panel is shown above the existing project selector footer, using a compact header
- **AND** it shows last-run metadata, loading and error states, validation status, and a persistent validation item list
- **AND** persistent validation preferences are kept out of the Explorer header
- **AND** summary counts are not duplicated between the header and the result list
- **AND** last-run metadata sits on its own line so the run button loading spinner does not cause horizontal layout shift

#### Scenario: Settings action opens validation settings
- **WHEN** the operator activates the settings action in the Validation panel title row
- **THEN** the Settings tab opens or focuses in the Main Viewer
- **AND** the Validation settings section is selected or scrolled into view
- **AND** the Validation Explorer panel remains available in the Explorer Pane

#### Scenario: Run Validate explains validation through native title
- **WHEN** the operator focuses or hovers the Run Validate action
- **THEN** the control provides explanatory text through the native button title describing what validation checks
- **AND** the panel does not need a persistent prose description above the action
- **AND** the initial placeholder action may be text-labeled for clarity
- **AND** the post-run header reload action is icon-only because it appears inside the dedicated Validation panel

#### Scenario: Validation panel loading state
- **WHEN** validation is running
- **THEN** the Validation panel displays a loading state
- **AND** the Run Validate action is disabled or indicates that a run is in progress
- **AND** last-run metadata does not shift horizontally because the button width changed

#### Scenario: Validation panel shows post-run reload and status count filters
- **WHEN** validation has completed and file-level status counts are available
- **THEN** the title row displays a compact reload action in the action cluster beside the Settings action
- **AND** the file-status count filters appear in a compact status row below the title row
- **AND** the status row displays compact counts for `failed`, `warning`, and `info`
- **AND** included statuses are visually distinguishable by status tone
- **AND** excluded statuses are visually muted or greyed out
- **AND** activating a count toggles that status between included and excluded
- **AND** the list shows non-passed attention items whose file-level status is currently included

#### Scenario: Validation result list remains persistent
- **WHEN** the operator selects a validation item in the Validation panel
- **THEN** the corresponding document opens or focuses in the Main Viewer when the item is navigable
- **AND** the Validation panel remains visible with the same result state so the operator can continue selecting other validation items

#### Scenario: Validation list reflects active Main Viewer tab
- **WHEN** a navigable validation item corresponds to the document currently active in the Main Viewer
- **THEN** that validation row renders the explorer selected-state styling
- **AND** other validation rows remain unselected unless they match the active tab path

#### Scenario: Validation panel pass state
- **WHEN** validation returns no items requiring attention
- **THEN** the Validation panel displays a passing status
- **AND** it does not render obsolete items from an earlier run

### Requirement: Search panel exposes a persistent viewer highlight toggle
The Search panel SHALL expose a toggle in its sticky header action area, using the `Highlighter` icon, that enables or disables in-page highlighting of the current search query in open markdown viewers, with warning-tone styling when enabled. The system SHALL persist the chosen state locally and restore it in later sessions. The Search header SHALL keep result status readable without a separate redundant result-count badge.

#### Scenario: Enable viewer highlighting from the Search header
- **WHEN** the operator enables the Search panel's highlight toggle while a valid search query is present
- **THEN** the toggle renders in its enabled warning-tone state
- **AND** open markdown viewers may show in-page highlights for the current query

#### Scenario: Restore persisted Search highlight preference
- **WHEN** the operator previously disabled the Search panel's highlight toggle and later reopens the app
- **THEN** the Search panel restores the toggle in the disabled state
- **AND** markdown viewers do not render query highlights until the operator enables it again

## ADDED Requirements

### Requirement: Validation panel stays open and tracks the active document
The Validation panel SHALL remain visible after a validation item opens a Main Viewer tab, and SHALL mark the row for the currently active validation document as selected when that item is navigable.

#### Scenario: Opening a validation item keeps the panel and selects its row
- **WHEN** the operator selects a navigable validation item and its document becomes the active Main Viewer tab
- **THEN** the Validation panel stays visible
- **AND** that item's row renders the selected state
