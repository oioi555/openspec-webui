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
Each tab SHALL display a file-type icon: dashboard → `LayoutDashboard` icon in `text-muted-foreground`, spec → `FileText` icon in `text-success`, change (active) → `SquarePen` icon in `text-info`, change (archived) → `Archive` icon in `text-muted-foreground`. The icon for change tabs SHALL be dynamically determined by checking if the change corresponds to an entry in the `archivedChanges` store, including when an already-open tab retains the original Change name and the archive entry has gained a leading `YYYY-MM-DD-` prefix. Archived change tabs SHALL remove a leading `YYYY-MM-DD-` prefix from the visible tab label while preserving the tab's existing full name in routing and data lookup. Non-pinned tabs SHALL display a close button — always visible for the active tab, on hover only for non-active tabs. Pinned tabs SHALL display a clickable pin icon instead of a close button.

#### Scenario: File-type icons and tab controls reflect tab state
- **WHEN** dashboard, spec, archived change, pinned, and non-pinned tabs are rendered
- **THEN** each tab uses the appropriate icon and label treatment
- **AND** pinned tabs show a pin icon instead of a close button

#### Scenario: Open Change tab updates after archive
- **WHEN** a Change tab is open under its original name
- **AND** refreshed workspace data contains a date-prefixed archive entry corresponding to that original name
- **THEN** the open tab displays the archived Change icon without being closed or reopened
- **AND** the tab retains its existing identity and route

### Requirement: Tab bar supports horizontal scrolling
Tab width SHALL have a minimum of 60px (`min-w-15`) with `shrink-0` to prevent infinite shrinking. Active tabs SHALL have a maximum width of 384px (`max-w-96`), while non-active tabs SHALL have a maximum width of 256px (`max-w-64`). Tabs SHALL be horizontally scrollable when they overflow the available width. The tab bar SHALL auto-scroll to the active tab when it changes using `scrollIntoView({ behavior: 'smooth', inline: 'center' })`. Mouse wheel scrolling SHALL be converted from vertical to horizontal scroll on the tab bar.

#### Scenario: Overflow tabs remain reachable
- **WHEN** the number of open tabs exceeds the available width
- **THEN** the tab bar scrolls horizontally
- **AND** the active tab stays in view
