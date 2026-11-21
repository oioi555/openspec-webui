# tabbed-viewer Specification

## Purpose
Tabbed document interface for the Main Viewer, keeping open documents easy to browse and switch between.

## Requirements

### Requirement: Tab bar renders open tabs
The system SHALL render a tab bar at the top of the Main Viewer showing all open tabs. The tab bar SHALL have a height of 48px (`h-12`) and apply `pl-2` so the first tab keeps a left-edge alignment with the Explorer panel's top project-selector row. This left-edge alignment is intentional because the tab strip should align with the Explorer panel content column rather than the Activity Bar icon center. Each tab SHALL display a file-type icon and its name.

#### Scenario: Open tabs appear in the Main Viewer
- **WHEN** the Main Viewer has one or more open tabs
- **THEN** the tab bar appears at the top of the Main Viewer
- **AND** each open tab is shown with its name

### Requirement: Tabs use active and inactive styling
The tab style SHALL use a rounded-top tab shape (`rounded-t-md border border-b-0`) for the active tab. The active tab SHALL have a border on top and sides (`border-border`) and a background matching the content area (`bg-background`), with `-mb-px` to visually connect with the content below. Non-active tabs SHALL have no border and `bg-transparent` background. Non-active tabs SHALL show a muted background on hover (`bg-muted/50`).

#### Scenario: Active and inactive tabs render distinct styles
- **WHEN** the Main Viewer contains both active and inactive tabs
- **THEN** the active tab uses the rounded-top active styling
- **AND** inactive tabs use the transparent hover styling

### Requirement: Tabs use file-type icons and controls
Each tab SHALL display a file-type icon for its kind: dashboard, spec, active change, or archived change. A change tab SHALL use the archived icon when it corresponds to an `archivedChanges` entry, including a date-prefixed entry for an open tab's original name. Archived change tabs SHALL hide a leading `YYYY-MM-DD-` prefix in the visible label while keeping the full name for routing and lookup. Non-pinned tabs SHALL display a close button; pinned tabs SHALL display a clickable pin icon instead.

#### Scenario: File-type icons and tab controls reflect tab state
- **WHEN** dashboard, spec, archived change, pinned, and non-pinned tabs are rendered
- **THEN** each tab uses the appropriate icon and label treatment
- **AND** pinned tabs show a pin icon instead of a close button

#### Scenario: Icons map to tab kinds
- **WHEN** tabs of each kind are rendered
- **THEN** dashboard tabs use `LayoutDashboard` in `text-muted-foreground`, spec tabs use `FileText` in `text-success`, active change tabs use `SquarePen` in `text-info`, and archived change tabs use `Archive` in `text-muted-foreground`
- **AND** a change tab's icon is chosen by checking whether the change corresponds to an entry in the `archivedChanges` store

#### Scenario: Archived change label hides the date prefix
- **WHEN** an archived change tab's name has a leading `YYYY-MM-DD-` prefix
- **THEN** the visible tab label omits that prefix
- **AND** routing and data lookup keep the tab's existing full name

#### Scenario: Close button visibility
- **WHEN** non-pinned tabs are rendered
- **THEN** the active tab's close button is always visible
- **AND** non-active tabs show the close button only on hover
- **AND** pinned tabs show a clickable pin icon instead

#### Scenario: Open Change tab updates after archive
- **WHEN** a Change tab is open under its original name
- **AND** refreshed workspace data contains a date-prefixed archive entry corresponding to that original name
- **THEN** the open tab displays the archived Change icon without being closed or reopened
- **AND** the tab retains its existing identity and route

### Requirement: Tab bar supports horizontal scrolling
Tabs SHALL be at least 60px wide (`min-w-15` with `shrink-0`) and at most 384px (`max-w-96`) when active or 256px (`max-w-64`) otherwise. The tab bar SHALL scroll horizontally when tabs overflow, SHALL auto-scroll to the active tab when it changes, and SHALL convert vertical mouse-wheel scrolling to horizontal scrolling.

#### Scenario: Overflow tabs remain reachable
- **WHEN** the number of open tabs exceeds the available width
- **THEN** the tab bar scrolls horizontally
- **AND** the active tab stays in view

#### Scenario: Active tab auto-scrolls into view
- **WHEN** the active tab changes
- **THEN** the tab bar calls `scrollIntoView({ behavior: 'smooth', inline: 'center' })` on it

#### Scenario: Mouse wheel scrolls tabs horizontally
- **WHEN** the operator scrolls the mouse wheel vertically over the tab bar
- **THEN** the tab bar scrolls horizontally instead
