# spec-browsing Specification

## Purpose
Expose capability specs through the Explorer Pane and open spec content in the tabbed Main Viewer.
## Requirements
### Requirement: Catalog capability specs
The system SHALL discover capability directories under `specs/`, sort them alphabetically, and display them in the Explorer Pane's SPECS collapsible section.

#### Scenario: List available capabilities in Explorer
- **WHEN** the workspace contains one or more spec capability directories
- **THEN** the Explorer Pane's SPECS section lists them in alphabetical order
- **AND** each entry shows the capability name

#### Scenario: Show an empty spec list in Explorer
- **WHEN** the workspace contains no spec capability directories
- **THEN** the Explorer Pane's SPECS section shows `No specifications found`

### Requirement: Active change display uses compact format with progress
The system SHALL display active changes with a compact second line showing the last modification date with Calendar icon, spec delta count with FileText icon, and task progress (done/total) with CircleCheckBig icon. The progress bar SHALL be displayed with a narrow width alongside the icon indicators.

#### Scenario: Active change shows compact second line with progress bar
- **WHEN** the Explorer Pane renders an active change with lastModified "2026-04-10", 3 spec deltas and 5/10 tasks
- **THEN** the second line shows a Calendar icon with "2026-04-10", a FileText icon with "3", a CircleCheckBig icon with "5/10"
- **AND** a narrow progress bar is displayed on the right side

### Requirement: Archive change display uses compact format
The system SHALL display archived changes with the date prefix (YYYY-MM-DD-) stripped from the name. The second line SHALL show the archived date with Calendar icon, spec delta count with FileText icon, and task progress (done/total) with CircleCheckBig icon. No progress bar SHALL be shown for archived changes.

#### Scenario: Archived change shows name without date prefix
- **WHEN** the Explorer Pane renders an archived change named "2026-04-06-migrate-svelte5-runes"
- **THEN** the first line shows "migrate-svelte5-runes"
- **AND** the tooltip on hover shows the full name including date prefix

#### Scenario: Archived change shows compact second line with date icon
- **WHEN** the Explorer Pane renders an archived change archived on 2026-04-06 with 3 spec deltas and 5/10 tasks
- **THEN** the second line shows a Calendar icon with "2026-04-06", a FileText icon with "3", and a CircleCheckBig icon with "5/10"
- **AND** no progress bar is displayed

### Requirement: Spec list shows last modified date with icon
The system SHALL display each spec entry with a Calendar icon and the last modification date in YYYY-MM-DD format on the second line.

#### Scenario: Spec shows last modified date with calendar icon
- **WHEN** the Explorer Pane renders a spec with lastModified "2026-04-08"
- **THEN** the second line shows a Calendar icon followed by "2026-04-08"

### Requirement: Render spec content
The system SHALL load a spec by capability name when the operator clicks it in the Explorer Pane, SHALL open a tab in the Main Viewer rendering `spec.md` content, and SHALL display the spec's last modification date using the same compact metadata style as other views: a Calendar icon followed by the formatted date when available, or `Specification` as fallback. The SpecViewer heading icon SHALL use the same `FileText`-based success color treatment as the Dashboard Specs summary card so spec surfaces share a consistent visual identity.

#### Scenario: View a capability spec
- **WHEN** the operator clicks a capability that has `spec.md` in the Explorer Pane
- **THEN** a tab opens in the Main Viewer
- **AND** the tab renders the specification content
- **AND** no design sub-tab is shown
- **AND** the header subtitle shows a Calendar icon and the formatted last modification date
- **AND** the heading icon uses the shared spec color treatment

### Requirement: Change lastModified includes spec delta file updates
The system SHALL include markdown files under `changes/<name>/specs/` when computing a change's `lastModified`, so ExplorerPane and ChangeViewer surface the newest relevant change update even when only a spec delta file changed.

#### Scenario: Spec delta file is the newest file in a change
- **WHEN** a change's newest modified file is `changes/<name>/specs/<capability>/spec.md`
- **THEN** the parsed change `lastModified` equals that spec delta file's modification time
- **AND** the change still renders spec deltas in the dedicated UI area rather than the regular file groups
