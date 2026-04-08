# tabbed-viewer Specification

## Purpose
Define the tabbed Main Viewer that keeps dashboard, spec, and change content open side by side within a single workspace flow.

## Requirements
### Requirement: Tab management system
The system SHALL provide a tab management store that maintains an ordered list of open tabs. Each tab SHALL have a unique ID, type (spec, change, or dashboard), display name, URL path, and optional pinned state. The store SHALL support operations: open tab, close tab, focus tab, reorder tabs, and pin/unpin tab.

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

#### Scenario: Close the last tab
- **WHEN** the operator closes the only remaining non-pinned tab
- **THEN** the Dashboard tab is shown as fallback

### Requirement: Tab bar renders open tabs
The system SHALL render a tab bar at the top of the Main Viewer showing all open tabs. Each tab SHALL display its name and a close button. The active tab SHALL be visually distinguished. Tabs SHALL be horizontally scrollable when they overflow the available width.

#### Scenario: Tab bar shows all open tabs
- **WHEN** three tabs are open
- **THEN** the tab bar shows three tab buttons with their names
- **AND** the active tab has a distinct visual style

#### Scenario: Tab overflow scrolls horizontally
- **WHEN** more tabs are open than fit in the tab bar width
- **THEN** the tab bar becomes horizontally scrollable
- **AND** tabs beyond the visible area can be accessed by scrolling

### Requirement: Tab close button
The system SHALL render a close button (X icon) on each tab. Clicking the close button SHALL close that tab.

#### Scenario: Close a tab via close button
- **WHEN** the operator clicks the close button on a tab
- **THEN** that tab is closed
- **AND** the adjacent tab becomes active

### Requirement: Tab pinning
The system SHALL allow the operator to pin a tab. Pinned tabs SHALL be displayed with a pin icon and SHALL be grouped at the left side of the tab bar. Pinned tabs SHALL not be closable via the close button.

#### Scenario: Pin a tab
- **WHEN** the operator pins a tab via context action
- **THEN** the tab moves to the pinned group at the left of the tab bar
- **AND** the tab shows a pin icon
- **AND** the close button is hidden for that tab

#### Scenario: Unpin a tab
- **WHEN** the operator unpins a pinned tab
- **THEN** the tab moves back to the unpinned group
- **AND** the close button reappears

### Requirement: URL synchronization with tabs
The system SHALL update the browser URL to match the active tab's path. When a URL is directly navigated to, the system SHALL open the corresponding tab if not already open.

#### Scenario: URL updates when tab changes
- **WHEN** the operator switches to a tab for spec `authentication`
- **THEN** the browser URL updates to `/specs/authentication`

#### Scenario: Direct URL opens corresponding tab
- **WHEN** the browser loads `/changes/login-feature` directly
- **THEN** a tab for that change is opened and made active
