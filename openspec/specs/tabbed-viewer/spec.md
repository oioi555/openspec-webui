# tabbed-viewer Specification

## Purpose
Define the tabbed Main Viewer that keeps dashboard, spec, and change content open side by side within a single workspace flow.
## Requirements
### Requirement: Tab management system
The system SHALL provide a tab management store that maintains an ordered list of open tabs. Each tab SHALL have a unique ID, type (spec, change, or dashboard), display name, URL path, optional pinned state, and optional preview state. The store SHALL support operations: open tab, close tab, focus tab, reorder tabs, pin/unpin tab, and open preview tab. The Dashboard tab SHALL be pinned by default, SHALL always be present, and SHALL NOT be closable or unpinnable. The tab store SHALL materialize tabs for the Dashboard route (`/`) and detail routes such as `/specs/<name>` and `/changes/<name>`. The system SHALL NOT create standalone list tabs for `/specs` or `/changes`; section browsing for Specs and Archive SHALL be handled by the Explorer Pane while the Main Viewer remains on the Dashboard or detail tabs. The ChangeViewer and SpecViewer SHALL use the `UnderlineTabs` component from `$lib/components/ui/underline-tabs/` for their internal sub-tab navigation instead of inline underline tab implementations. The `UnderlineTabs` API SHALL support optional badge counts so ChangeViewer can render file group counts and spec delta counts without feature-specific badge markup. The MainViewer SHALL NOT contain any suggestion panel or suggestion mode sidebar logic. The ChangeViewer SHALL use the project's ContextMenu component to provide a right-click context menu on the markdown content area, enabling text copy and quoted copy operations with change and file context. The primary content container in ChangeViewer and SpecViewer, along with spec delta containers rendered inside ChangeViewer, SHALL use the shared Card surface pattern instead of feature-local inline card foundations. The store SHALL provide an `openPreview(path)` method that reuses an existing non-pinned preview tab or creates a new preview tab. When a preview tab is pinned or double-clicked in the TabBar, its `preview` property SHALL be set to `false`.

#### Scenario: MainViewer renders content without suggestion panel
- **WHEN** the operator views any tab content
- **THEN** the Main Viewer renders only the content area with tab bar
- **AND** no suggestion panel sidebar or suggestion sheet overlay is present

#### Scenario: ChangeViewer provides context menu on markdown content
- **WHEN** the operator views a change tab and right-clicks on the markdown content area
- **THEN** a context menu appears with copy-related actions
- **AND** the menu uses the ContextMenu component from `$lib/components/ui/context-menu/`

#### Scenario: openPreview reuses existing preview tab
- **WHEN** a preview tab showing "spec-a" exists
- **AND** the store's `openPreview("/specs/spec-b")` is called
- **THEN** the preview tab's content is updated to show "spec-b"
- **AND** no additional tab is created

#### Scenario: openPreview creates new preview tab when none exists
- **WHEN** no preview tab exists
- **AND** the store's `openPreview("/specs/spec-a")` is called
- **THEN** a new tab is created with `preview: true`
- **AND** the new tab becomes active

### Requirement: Tab bar renders open tabs
The system SHALL render a tab bar at the top of the Main Viewer showing all open tabs. The tab bar SHALL have a height of 48px (`h-12`) and apply `pl-2` so the first tab keeps a left-edge alignment with the Explorer panel's top project-selector row. This left-edge alignment is intentional because the ActivityBar's top icon is the project button while the Explorer panel's top row is the project selector, so the tab bar should follow that row's leading edge rather than the ActivityBar icon center. Each tab SHALL display a file-type icon and its name. The tab style SHALL use a rounded-top tab shape (`rounded-t-md border border-b-0`) for the active tab. The active tab SHALL have a border on top and sides (`border-border`) and a background matching the content area (`bg-background`), with `-mb-px` to visually connect with the content below. Non-active tabs SHALL have no border and `bg-transparent` background. Non-active tabs SHALL show a muted background on hover (`bg-muted/50`). Each tab SHALL display a file-type icon: dashboard → `LayoutDashboard` icon in `text-muted-foreground`, spec → `FileText` icon in `text-primary`, change (active) → `SquarePen` icon in `text-info`, change (archived) → `Archive` icon in `text-muted-foreground`. The icon for change tabs SHALL be dynamically determined by checking if the change exists in the `archivedChanges` store. Archived change tabs SHALL remove a leading `YYYY-MM-DD-` prefix from the visible tab label while preserving the full change name in routing and data lookup. Non-pinned tabs SHALL display a close button — always visible for the active tab, on hover only for non-active tabs. Pinned tabs SHALL display a clickable pin icon instead of a close button. Tab width SHALL have a minimum of 60px (`min-w-15`) with `shrink-0` to prevent infinite shrinking. Active tabs SHALL have a maximum width of 384px (`max-w-96`), while non-active tabs SHALL have a maximum width of 256px (`max-w-64`). Tabs SHALL be horizontally scrollable when they overflow the available width. The tab bar SHALL auto-scroll to the active tab when it changes using `scrollIntoView({ behavior: 'smooth', inline: 'center' })`. Mouse wheel scrolling SHALL be converted from vertical to horizontal scroll on the tab bar.

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

### Requirement: Tab close button
The system SHALL render a close button (X icon) on each non-pinned tab. The close button SHALL be always visible for the active tab, and only visible on hover for non-active tabs. Clicking the close button SHALL close that tab.

#### Scenario: Close a tab via close button
- **WHEN** the operator clicks the close button on a non-pinned tab
- **THEN** that tab is closed
- **AND** the adjacent tab becomes active

### Requirement: Tab pinning
The system SHALL allow the operator to pin a tab via the context menu or unpin via the pin icon click. Pinned tabs SHALL be displayed with a clickable pin icon (replacing the close button) and SHALL be grouped at the left side of the tab bar. Pinned tabs SHALL not be closable via the close button. The operator SHALL be able to unpin a tab via the context menu or by clicking the pin icon.

#### Scenario: Pin a tab via context menu
- **WHEN** the operator right-clicks a non-pinned tab and selects "Pin"
- **THEN** the tab moves to the pinned group at the left of the tab bar
- **AND** the tab shows a pin icon in place of the close button
- **AND** the close button is no longer shown for that tab

#### Scenario: Unpin a tab via context menu
- **WHEN** the operator right-clicks a pinned tab and selects "Unpin"
- **THEN** the tab moves back to the unpinned group
- **AND** the pin icon is replaced by the close button

#### Scenario: Unpin a tab via pin icon click
- **WHEN** the operator clicks the pin icon on a pinned tab
- **THEN** the tab is unpinned and moves back to the unpinned group
- **AND** the pin icon is replaced by the close button

### Requirement: Tab context menu
The system SHALL provide a context menu on each tab when the operator right-clicks. The context menu SHALL contain the following items: Pin/Unpin (toggles based on current state), Close, Close Others, Close All, a separator, Copy Name, and Copy Path. The context menu SHALL use a custom ContextMenu component following the project's dropdown-menu pattern. The context menu position SHALL be clamped to the viewport to prevent overflow.

#### Scenario: Context menu appears on right-click
- **WHEN** the operator right-clicks on any tab
- **THEN** a context menu appears with the following items: Pin/Unpin, Close, Close Others, Close All, separator, Copy Name, Copy Path

#### Scenario: Context menu shows Unpin for pinned tab
- **WHEN** the operator right-clicks on a pinned tab
- **THEN** the context menu shows "Unpin" instead of "Pin"

#### Scenario: Close Others closes all non-pinned tabs except the target
- **WHEN** the operator right-clicks a tab and selects "Close Others"
- **THEN** all other non-pinned tabs are closed
- **AND** the right-clicked tab remains open and active

#### Scenario: Close All closes all non-pinned tabs
- **WHEN** the operator right-clicks any tab and selects "Close All"
- **THEN** all non-pinned tabs are closed
- **AND** the first pinned tab (or Home tab) becomes active

#### Scenario: Copy Name copies tab name to clipboard
- **WHEN** the operator right-clicks a tab and selects "Copy Name"
- **THEN** the tab's display name is copied to the clipboard
- **AND** a toast notification confirms the copy action

#### Scenario: Copy Path copies prefixed path to clipboard
- **WHEN** the operator right-clicks a tab and selects "Copy Path"
- **THEN** the path is copied with `openspec` prefix (e.g., `openspec/specs/authentication`)
- **AND** a toast notification confirms the copy action

#### Scenario: Context menu items are disabled for Home tab
- **WHEN** the operator right-clicks the Home tab
- **THEN** the "Close", "Close Others", and "Pin/Unpin" items are disabled
- **AND** the "Copy Name", "Copy Path", and "Close All" items remain enabled

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

### Requirement: Preview tab mode
The system SHALL support a preview tab mode in which single-clicking an item in the Explorer Pane opens the content in a reusable preview tab instead of creating a new tab each time. A tab SHALL have an optional `preview` boolean property. When `preview` is `true`, the tab is considered a preview tab. Preview tabs SHALL be visually distinguished from confirmed tabs using italic text style in the TabBar. The system SHALL provide an `openPreview(path)` method on the tab store with the following behavior: (1) If a confirmed tab (non-preview) with the same path already exists, the system SHALL focus that tab without creating a new one. (2) If a preview tab already exists and is not pinned, the system SHALL replace that preview tab's content (id, type, name, path) with the new path's content. (3) If neither condition applies, the system SHALL create a new tab with `preview: true`. Pinned tabs SHALL NOT be replaced by preview tab reuse logic — the system SHALL skip pinned tabs when searching for a reusable preview slot. The preview-tab mode SHALL be operator-configurable from Settings and SHALL default to enabled.

#### Scenario: Single click opens preview tab
- **WHEN** the operator single-clicks a spec item in the Explorer Pane
- **THEN** a new tab is opened with `preview: true`
- **AND** the tab name is displayed in italic style in the TabBar

#### Scenario: Preview tab reuse on subsequent single click
- **WHEN** a preview tab exists (e.g., showing "spec-a")
- **AND** the operator single-clicks a different item (e.g., "spec-b")
- **THEN** the existing preview tab's content is replaced to show "spec-b"
- **AND** no additional tab is created

#### Scenario: Single click on already-open confirmed tab focuses it
- **WHEN** a confirmed tab for "spec-a" exists (preview is false or undefined)
- **AND** the operator single-clicks "spec-a" in the Explorer Pane
- **THEN** the existing confirmed tab is focused
- **AND** no new tab or preview tab is created

#### Scenario: Pinned tab is not replaced by preview
- **WHEN** the only non-active tab is a pinned tab
- **AND** the operator single-clicks a spec item in the Explorer Pane
- **THEN** a new preview tab is created
- **AND** the pinned tab remains unchanged

#### Scenario: Dashboard Home tab is never overwritten by preview
- **WHEN** the operator single-clicks an item in the Explorer Pane
- **THEN** the Home (Dashboard) tab is not affected
- **AND** it remains pinned and unchanged

#### Scenario: Preview tab becomes confirmed on pin
- **WHEN** the operator pins a preview tab via context menu
- **THEN** the tab's `preview` property is set to `false`
- **AND** the tab is treated as a confirmed (pinned) tab

#### Scenario: Preview tab becomes confirmed on TabBar double-click
- **WHEN** the operator double-clicks a preview tab in the TabBar
- **THEN** the tab's `preview` property is set to `false`
- **AND** the tab name returns to normal (non-italic) style

#### Scenario: Disabling preview mode confirms existing preview tabs
- **WHEN** preview-tab mode is turned off in Settings
- **THEN** any existing preview tabs are converted to confirmed tabs
- **AND** their tab names return to normal (non-italic) style

### Requirement: Explorer confirmed-tab actions
When preview-tab mode is enabled, the system SHALL provide non-delayed actions for opening Explorer items as confirmed tabs (non-preview). Ctrl+Click or Cmd+Click on an item SHALL execute the confirmed-tab flow. The item context menu SHALL provide an "Open in New Tab" action that executes the same confirmed-tab flow. If a preview tab for the same path already exists, the confirmed-tab flow SHALL convert that tab into a confirmed tab by setting `preview` to `false`. Otherwise, the confirmed-tab flow SHALL use the same behavior as the existing `open()` method (focus an existing confirmed tab with the same path or create a new confirmed tab).

#### Scenario: Ctrl+Click or Cmd+Click opens confirmed tab
- **WHEN** the operator Ctrl+Clicks or Cmd+Clicks a change item in the Explorer Pane
- **THEN** a tab is opened with `preview: false`
- **AND** the tab name is displayed in normal (non-italic) style

#### Scenario: Ctrl+Click or Cmd+Click confirms an existing preview tab
- **WHEN** a preview tab for "spec-a" exists
- **AND** the operator Ctrl+Clicks or Cmd+Clicks "spec-a" in the Explorer Pane
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

### Requirement: Explorer Pane click behavior
The Explorer Pane SHALL open preview content immediately on item single-click when preview-tab mode is enabled. No delay or double-click discrimination SHALL be required for preview opening. When preview-tab mode is disabled, item single-click SHALL open the item as a confirmed tab. Non-item interactions (e.g., section toggle, project selector) SHALL remain unaffected.

#### Scenario: Single-click triggers preview immediately
- **WHEN** the operator clicks an Explorer Pane item once
- **THEN** `openPreview()` is called for that item's path

#### Scenario: Single-click opens confirmed tab when preview mode is disabled
- **WHEN** preview-tab mode is disabled in Settings
- **AND** the operator clicks an Explorer Pane item once
- **THEN** the system opens that item as a confirmed tab
- **AND** no preview tab is created

### Requirement: Preview tab visual distinction
The TabBar SHALL render preview tabs with italic font style (`italic`) to visually distinguish them from confirmed tabs. Confirmed tabs SHALL use normal font style. The tab's tooltip or aria-label SHALL indicate "Preview" for preview tabs.

#### Scenario: Preview tab displayed in italic
- **WHEN** a tab with `preview: true` is rendered in the TabBar
- **THEN** the tab name is displayed in italic style
- **AND** the tab has an aria-label or tooltip indicating "Preview"

#### Scenario: Confirmed tab displayed in normal style
- **WHEN** a tab with `preview: false` or `preview: undefined` is rendered
- **THEN** the tab name is displayed in normal (non-italic) style

