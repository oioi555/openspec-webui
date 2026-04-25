## MODIFIED Requirements

### Requirement: Tab bar renders open tabs
The system SHALL render a tab bar at the top of the Main Viewer showing all open tabs. The tab bar SHALL have a height of 48px (`h-12`) and apply `pl-2` so the first tab keeps a left-edge alignment with the Explorer panel's top project-selector row. This left-edge alignment is intentional because the ActivityBar's top icon is the project button while the Explorer panel's top row is the project selector, so the tab bar should follow that row's leading edge rather than the ActivityBar icon center. Each tab SHALL display a file-type icon and its name. The tab style SHALL use a rounded-top tab shape (`rounded-t-md border border-b-0`) for the active tab. The active tab SHALL have a border on top and sides (`border-border`) and a background matching the content area (`bg-background`), with `-mb-px` to visually connect with the content below. Non-active tabs SHALL have no border and `bg-transparent` background. Non-active tabs SHALL show a muted background on hover (`bg-muted/50`). Each tab SHALL display a file-type icon: dashboard → `LayoutDashboard` icon in `text-muted-foreground`, spec → `FileText` icon in `text-success`, change (active) → `SquarePen` icon in `text-info`, change (archived) → `Archive` icon in `text-muted-foreground`. The icon for change tabs SHALL be dynamically determined by checking if the change exists in the `archivedChanges` store. Archived change tabs SHALL remove a leading `YYYY-MM-DD-` prefix from the visible tab label while preserving the full change name in routing and data lookup. Non-pinned tabs SHALL display a close button — always visible for the active tab, on hover only for non-active tabs. Pinned tabs SHALL display a clickable pin icon instead of a close button. Tab width SHALL have a minimum of 60px (`min-w-15`) with `shrink-0` to prevent infinite shrinking. Active tabs SHALL have a maximum width of 384px (`max-w-96`), while non-active tabs SHALL have a maximum width of 256px (`max-w-64`). Tabs SHALL be horizontally scrollable when they overflow the available width. The tab bar SHALL auto-scroll to the active tab when it changes using `scrollIntoView({ behavior: 'smooth', inline: 'center' })`. Mouse wheel scrolling SHALL be converted from vertical to horizontal scroll on the tab bar.

#### Scenario: Tab bar shows all open tabs with icons
- **WHEN** three tabs are open (dashboard, spec, change)
- **THEN** the tab bar shows three tabs with their names and file-type icons
- **AND** each icon matches the tab type (LayoutDashboard, FileText, SquarePen)
- **AND** the active tab has a tab shape with border and background matching content

#### Scenario: Tab bar uses left-edge inset instead of ActivityBar-center alignment
- **WHEN** the tab bar is rendered beside the Explorer panel
- **THEN** the tab list applies `pl-2`
- **AND** the first tab starts with a small left inset from the Main Viewer edge instead of centering on the ActivityBar icon column

#### Scenario: Archived change tab shows Archive icon
- **WHEN** an archived change tab is rendered
- **THEN** the tab displays an Archive icon in `text-muted-foreground`
- **AND** non-archived change tabs display a SquarePen icon in `text-info`

#### Scenario: Archived change tab label omits date prefix
- **WHEN** an archived change named `2026-04-09-explorer-simplify-navigation` is opened
- **THEN** the visible tab label is `explorer-simplify-navigation`
- **AND** the route and data lookup still use the full archived change name

#### Scenario: Pinned Home tab shows pin icon instead of close button
- **WHEN** the tab bar renders with the Home tab
- **THEN** the Home tab displays a clickable pin icon indicating pinned state
- **AND** no close button is shown on the Home tab

#### Scenario: Active non-pinned tab shows close button always
- **WHEN** a non-pinned active tab is rendered
- **THEN** the close button is always visible (opacity-100)

#### Scenario: Non-active non-pinned tab shows close button on hover only
- **WHEN** a non-pinned non-active tab is rendered
- **THEN** the close button is hidden by default
- **AND** the close button appears when the operator hovers over the tab

#### Scenario: Pinned tab shows clickable pin icon
- **WHEN** a pinned tab is rendered
- **THEN** the tab displays a pin icon at the right side
- **AND** clicking the pin icon unpins the tab
- **AND** no close button is shown

#### Scenario: Tab overflow scrolls horizontally
- **WHEN** more tabs than fit in the tab bar width
- **THEN** the tab bar becomes horizontally scrollable
- **AND** tabs beyond the visible area can be accessed by scrolling

#### Scenario: Tab width respects minimum and maximum bounds
- **WHEN** few tabs are open
- **THEN** tab names are fully displayed without truncation (up to max-w-64 for non-active, max-w-96 for active)
- **AND** when many tabs are open, tabs shrink to minimum 60px (min-w-15) and horizontal scrolling is enabled

#### Scenario: Drag and drop reorders tabs
- **WHEN** the operator drags a tab and drops it at a different position
- **THEN** the tab is moved to the new position
- **AND** the tab order is updated via the store's `reorder` method
- **AND** the dragged tab shows a visual indicator during drag (reduced opacity)

#### Scenario: Dragging across pinned/unpinned boundary preserves grouping
- **WHEN** the operator drags an unpinned tab before the first pinned tab
- **THEN** the `normalizeTabOrder` function ensures pinned tabs remain grouped at the left

#### Scenario: Drop at rightmost position
- **WHEN** the operator drags a tab and drops it at the rightmost end of the tab bar
- **THEN** the tab is moved to the last position via a drop zone after the last tab

### Requirement: Explorer confirmed-tab actions
When preview-tab mode is enabled, the system SHALL provide non-delayed actions for opening Explorer items as confirmed tabs (non-preview). Ctrl+Click on an item SHALL execute the confirmed-tab flow. Cmd+Click (metaKey) is NOT currently checked; only `event.ctrlKey` is evaluated. The item context menu SHALL provide an "Open in New Tab" action that executes the same confirmed-tab flow. If a preview tab for the same path already exists, the confirmed-tab flow SHALL convert that tab into a confirmed tab by setting `preview` to `false`. Otherwise, the confirmed-tab flow SHALL use the same behavior as the existing `open()` method (focus an existing confirmed tab with the same path or create a new confirmed tab).

#### Scenario: Ctrl+Click opens confirmed tab
- **WHEN** the operator Ctrl+Clicks a change item in the Explorer Pane
- **THEN** a tab is opened with `preview: false`
- **AND** the tab name is displayed in normal (non-italic) style

#### Scenario: Ctrl+Click confirms an existing preview tab
- **WHEN** a preview tab for "spec-a" exists
- **AND** the operator Ctrl+Clicks "spec-a" in the Explorer Pane
- **THEN** the preview tab is converted to a confirmed tab (`preview: false`)
- **AND** the tab name changes from italic to normal style

#### Scenario: Explorer context menu opens confirmed tab
- **WHEN** the operator opens an item context menu in the Explorer Pane
- **AND** selects "Open in New Tab"
- **THEN** the confirmed-tab flow is executed for that item's path
- **AND** the opened tab is not marked as preview

#### Scenario: Reused preview tab remains active
- **WHEN** a preview tab exists
- **AND** the operator single-clicks a different item in the Explorer Pane
- **THEN** the existing preview tab is reused for the new item
- **AND** that reused preview tab remains the active tab

### Requirement: URL synchronization with tabs
The system SHALL update the browser URL to match the active tab's path. When a URL is directly navigated to, the system SHALL open the corresponding detail tab if not already open. Direct navigation to `/specs` or `/changes` SHALL resolve to the Dashboard route (`/`) instead of opening dedicated list pages. The `normalizePath` function in the tab store handles this normalization.

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
