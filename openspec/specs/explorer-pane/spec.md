# explorer-pane Specification

## Purpose
Define the Explorer Pane that organizes active changes, archives, and specs beside the Activity Bar.
## Requirements
### Requirement: Explorer Pane renders collapsible sections
The system SHALL render an Explorer Pane between the Activity Bar and the Main Viewer. The Explorer Pane SHALL use the `ExplorerSection` component for each of its three sections (ACTIVE CHANGES, ARCHIVE, SPECS). Each section SHALL pass its title, item count, collapse state, focused state, and header icon as props, and SHALL render section-specific content via slots. The ACTIVE CHANGES section SHALL use the `headerExtra` slot to render `CommandShortcutBar` when workspace commands exist and SHALL render a sort control that lets the operator choose `Date` or `Name` ordering. The ARCHIVE and SPECS sections SHALL also render the same `Date` / `Name` sort control in their section headers. Explorer list items SHALL NOT render leading per-item icons on the first line. No inline collapsible section header markup SHALL remain in `ExplorerPane.svelte` outside of the `ExplorerSection` component usage. Each list item SHALL use the `ExplorerSectionItem` component, which internally uses `ItemContextMenu` to provide context menu actions and handles click interactions. Each section SHALL pass `emptyMessage` props to `ExplorerSection` to handle empty states internally; the `emptyIcon` is determined internally by each ExplorerSection component reusing its section header icon.

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
The system SHALL synchronize Activity Bar selection with Explorer Pane expansion presets. Selecting Home from the Activity Bar SHALL expand ACTIVE CHANGES and collapse ARCHIVE and SPECS. Selecting Archive from the Activity Bar SHALL expand ARCHIVE and collapse ACTIVE CHANGES and SPECS. Selecting Specs from the Activity Bar SHALL expand SPECS and collapse ACTIVE CHANGES and ARCHIVE. Selecting Search from the Activity Bar SHALL show the Search panel. Selecting Validate from the Activity Bar SHALL show the Validation panel. Manual section toggles inside the Explorer Pane SHALL remain allowed until the next Activity Bar preset change.

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

### Requirement: Explorer section headers scroll into view on programmatic focus
The system SHALL scroll the focused explorer section header to the top of the explorer pane when the `focusedSection` state changes programmatically. This SHALL apply when focus is triggered by dashboard card clicks, dashboard summary card clicks, and activity bar preset selection. The scroll SHALL use smooth behavior and align the header to the top of the scroll area (`block: 'start'`). The scroll SHALL be deferred until after the section expansion DOM update completes.

#### Scenario: Dashboard card click scrolls section header into view
- **WHEN** the operator clicks a dashboard card that calls `focusSection()` for a specific section
- **THEN** the target explorer section expands (if collapsed)
- **AND** the section header scrolls smoothly to the top of the explorer pane

#### Scenario: Activity bar preset click scrolls section header into view
- **WHEN** the operator clicks an activity bar button that calls `setActivityPreset()`
- **THEN** the target explorer section expands (if collapsed)
- **AND** the section header scrolls smoothly to the top of the explorer pane

#### Scenario: Dashboard summary card scrolls section header into view
- **WHEN** the operator clicks a dashboard summary card that calls `setActivityPreset()`
- **THEN** the target explorer section expands (if collapsed)
- **AND** the section header scrolls smoothly to the top of the explorer pane

#### Scenario: Section already visible does not disrupt
- **WHEN** the focused section header is already at or near the top of the explorer pane
- **THEN** the scroll call is a no-op or produces minimal visual movement
- **AND** no layout shift or flicker occurs

#### Scenario: Direct user toggle still scrolls as before
- **WHEN** the operator clicks a section header directly in the explorer pane to expand it
- **THEN** the existing `scrollIntoView` behavior in the toggle handler continues to work
- **AND** the new reactive scroll does not produce a double-scroll

### Requirement: Explorer Pane renders a persistent Search panel
The system SHALL render Search as a dedicated Explorer Pane panel separate from the Active Changes, Archive, and Specs section group. When Search is active, the Explorer Pane SHALL show only the Search panel above the existing project selector footer. The panel SHALL follow the existing Explorer visual language while using a larger fixed header, localized explanatory description, search input, and persistent result list. The panel SHALL show result counts, loading state, short-query guidance, empty results, and a clear control as appropriate. Search result rows SHALL render as Explorer-style selectable list items using shared entity visual semantics, including distinct active-change and archived-change treatment when change results can be resolved to either state.

#### Scenario: Search panel initial state
- **WHEN** the Explorer Pane is switched to Search and no search query has been entered
- **THEN** the Search panel displays a prominent Search header
- **AND** it displays localized explanatory text describing the search scope
- **AND** it displays a search input
- **AND** it displays guidance that at least two characters are required

#### Scenario: Search panel result list
- **WHEN** a valid search query returns matches
- **THEN** the Search panel displays the number of matches
- **AND** it renders each result as a selectable Explorer-style list item with shared type semantics, name, and excerpt
- **AND** archived change results are visually distinguishable from active change results

#### Scenario: Search result selection preserves panel
- **WHEN** the operator selects a result in the Search panel
- **THEN** the corresponding document opens or focuses in the Main Viewer
- **AND** the Search panel remains visible with the same results so the operator can continue selecting other matches

#### Scenario: Search header remains visible while results scroll
- **WHEN** the operator scrolls a long Search result list
- **THEN** the Search header, description, current query, status, and clear control remain visible at the top of the Search panel
- **AND** only the result list scrolls

#### Scenario: Search panel clear control
- **WHEN** the Search panel has a query or visible results
- **THEN** the panel provides a clear control
- **AND** activating the clear control clears the query and visible results without closing the Explorer Pane

### Requirement: Explorer Pane renders a persistent Validation panel
The system SHALL render Validation as a dedicated Explorer Pane panel separate from the Active Changes, Archive, and Specs section group. When Validation is active, the Explorer Pane SHALL show only the Validation panel above the existing project selector footer. The panel SHALL follow the existing Explorer visual language while using a compact header, initial list placeholder with prominent Run Validate action, compact post-run reload action, last-run metadata, loading and error states, result-visible compact file-status count filters, validation status, and persistent validation item list. The title row SHALL show the Validation title and a compact action that opens Settings to the Validation section. The title row SHALL NOT show the validation result status badge. Before a result exists, explanatory content and the prominent Run Validate action SHALL live in the list placeholder. After a result exists, the compact reload action SHALL appear in the title-row action cluster beside the Settings action, and file-status count filters SHALL appear in a compact status row below. The panel SHALL keep persistent validation preferences out of the Explorer header, SHALL avoid duplicating summary counts between the header and result list, SHALL place last-run metadata on its own line so the run button loading spinner does not cause horizontal layout shift, and SHALL remain visible after a validation item opens a Main Viewer tab.

#### Scenario: Validation panel initial state
- **WHEN** the Explorer Pane is switched to Validation and no validation result exists
- **THEN** the Validation panel displays a compact Validation header
- **AND** the title row includes a small settings action
- **AND** the title row does not include the post-run reload action before validation has run
- **AND** the title row does not display a validation status badge
- **AND** the list area displays an explanatory placeholder
- **AND** the placeholder displays a prominent text-labeled Run Validate action
- **AND** the header does not display file-status count filters before a result exists

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
- **THEN** the title row displays a compact reload action beside the Settings action
- **AND** the status row displays compact counts for `failed`, `warning`, and `info`
- **AND** included statuses are visually distinguishable by status tone
- **AND** excluded statuses are visually muted or greyed out
- **AND** activating a count toggles that status between included and excluded
- **AND** the list shows non-passed attention items whose file-level status is currently included

#### Scenario: Validation result list remains persistent
- **WHEN** the operator selects a validation item in the Validation panel
- **THEN** the corresponding document opens or focuses in the Main Viewer when the item is navigable
- **AND** the Validation panel remains visible with the same result state so the operator can continue selecting other validation items

#### Scenario: Validation panel pass state
- **WHEN** validation returns no items requiring attention
- **THEN** the Validation panel displays a passing status
- **AND** it does not render obsolete items from an earlier run

