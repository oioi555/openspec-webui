## MODIFIED Requirements

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
