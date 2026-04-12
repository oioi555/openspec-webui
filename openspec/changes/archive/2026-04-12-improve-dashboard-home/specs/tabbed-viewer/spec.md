## MODIFIED Requirements

### Requirement: Tab management system
The system SHALL provide a tab management store that maintains an ordered list of open tabs. Each tab SHALL have a unique ID, type (spec, change, or dashboard), display name, URL path, and optional pinned state. The store SHALL support operations: open tab, close tab, focus tab, reorder tabs, and pin/unpin tab. The Dashboard tab SHALL be pinned by default, SHALL always be present, and SHALL NOT be closable or unpinnable. The tab store SHALL materialize tabs for the Dashboard route (`/`) and detail routes such as `/specs/<name>` and `/changes/<name>`. The system SHALL NOT create standalone list tabs for `/specs` or `/changes`; section browsing for Specs and Archive SHALL be handled by the Explorer Pane while the Main Viewer remains on the Dashboard or detail tabs. The ChangeViewer and SpecViewer SHALL use the `UnderlineTabs` component from `$lib/components/ui/underline-tabs/` for their internal sub-tab navigation instead of inline underline tab implementations. The `UnderlineTabs` API SHALL support optional badge counts so ChangeViewer can render file group counts and spec delta counts without feature-specific badge markup.

#### Scenario: Open a new tab
- **WHEN** the operator opens a spec that is not currently in a tab
- **THEN** a new tab is appended to the tab list
- **AND** the new tab becomes the active tab
- **AND** the tab content is rendered in the Main Viewer

#### Scenario: Focus an existing tab
- **WHEN** the operator clicks on an already-open tab
- **THEN** that tab becomes the active tab
- **AND** the Main Viewer shows its content
- **AND** no new tab is created

#### Scenario: Close a tab
- **WHEN** the operator closes a tab that is not the only tab
- **THEN** the tab is removed from the tab list
- **AND** the adjacent tab becomes active

#### Scenario: Close the last remaining tab falls back to Dashboard
- **WHEN** the operator closes the only remaining non-pinned tab
- **THEN** the Dashboard tab becomes active

#### Scenario: Dashboard tab is pinned and cannot be closed
- **WHEN** the application loads
- **THEN** the Dashboard tab is present and pinned
- **AND** the close button is not displayed on the Dashboard tab

#### Scenario: Attempting to close the Dashboard tab
- **WHEN** the operator attempts to close the Dashboard tab
- **THEN** the Dashboard tab remains open and pinned

#### Scenario: Direct URL load still keeps Dashboard tab available
- **WHEN** the browser loads `/specs/authentication` or `/changes/login-feature` directly
- **THEN** a tab for the requested route is opened and made active
- **AND** the Dashboard tab is still present and pinned in the tab bar

#### Scenario: Section list routes resolve to Dashboard
- **WHEN** the browser loads `/specs` or `/changes` directly
- **THEN** the system resolves the route to the Dashboard tab
- **AND** the system does not create a standalone Specs or Changes list tab

#### Scenario: Attempting to unpin the Dashboard tab
- **WHEN** the operator attempts to unpin the Dashboard tab
- **THEN** the Dashboard tab remains pinned
- **AND** the Dashboard tab remains open

#### Scenario: SpecViewer uses UnderlineTabs component
- **WHEN** the operator views a spec that has both `spec.md` and `design.md`
- **THEN** the sub-tab navigation is rendered using the `UnderlineTabs` component
- **AND** switching between Specification and Design tabs works correctly

#### Scenario: ChangeViewer uses UnderlineTabs component with badge counts
- **WHEN** the operator views a change detail with file groups and spec deltas
- **THEN** the primary tab navigation is rendered using the `UnderlineTabs` component
- **AND** file group counts and spec delta counts are passed via the `badge` field instead of inline badge spans in `ChangeViewer.svelte`

#### Scenario: No inline underline tab classes remain in feature components
- **WHEN** `SpecViewer.svelte` or `ChangeViewer.svelte` is inspected
- **THEN** no feature-local underline tab button markup remains for those primary tab navigations

### Requirement: URL synchronization with tabs
The system SHALL update the browser URL to match the active tab's path. When a URL is directly navigated to, the system SHALL open the corresponding detail tab if not already open. Direct navigation to `/specs` or `/changes` SHALL resolve to the Dashboard route (`/`) instead of opening dedicated list pages.

#### Scenario: URL updates when tab changes
- **WHEN** the operator switches to a tab for spec `authentication`
- **THEN** the browser URL updates to `/specs/authentication`

#### Scenario: Direct URL opens corresponding detail tab
- **WHEN** the browser loads `/changes/login-feature` directly
- **THEN** a tab for that change is opened and made active
- **AND** the Dashboard tab is still present and pinned in the tab bar

#### Scenario: Direct section URL resolves to Dashboard
- **WHEN** the browser loads `/specs` or `/changes`
- **THEN** the browser URL is normalized to `/`
- **AND** the Main Viewer stays on the Dashboard tab
