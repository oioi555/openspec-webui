# spec-browsing Specification

## Purpose
Expose capability specs through the Explorer Pane and open spec content in the tabbed Main Viewer.
## Requirements
### Requirement: Catalog capability specs
The system SHALL discover capability directories under `specs/`, sort them alphabetically by default, and display them in the Explorer Pane's SPECS collapsible section. The operator SHALL be able to switch the SPECS section between `Name` ordering and `Date` ordering from the section header. When `Date` ordering is selected, specs SHALL be sorted by last modification datetime descending.

#### Scenario: List available capabilities in Explorer by default name order
- **WHEN** the workspace contains one or more spec capability directories
- **THEN** the Explorer Pane's SPECS section lists them in alphabetical order by default
- **AND** each entry shows the capability name

#### Scenario: Sort specs by last modification datetime
- **WHEN** the operator selects `Date` ordering in the SPECS section
- **THEN** the Explorer Pane's SPECS section lists specs from newest to oldest by `lastModified`

#### Scenario: Show an empty spec list in Explorer
- **WHEN** the workspace contains no spec capability directories
- **THEN** the Explorer Pane's SPECS section shows `No specs found`

### Requirement: Active change display uses compact format with progress
The system SHALL display active changes with a compact second line showing the last modification datetime with Calendar icon, spec delta count with FileText icon, and task progress (done/total) with CircleCheckBig icon. The progress bar SHALL be displayed with a narrow width alongside the icon indicators.

#### Scenario: Active change shows compact second line with progress bar
- **WHEN** the Explorer Pane renders an active change with a lastModified datetime, 3 spec deltas and 5/10 tasks
- **THEN** the second line shows a Calendar icon with the last modification datetime in canonical `YYYY-MM-DD HH:mm` format reflecting the browser's local timezone, a FileText icon with "3", a CircleCheckBig icon with "5/10"
- **AND** a narrow progress bar is displayed on the right side

### Requirement: Archive change display uses compact format
The system SHALL display archived changes with the date prefix (YYYY-MM-DD-) stripped from the name. The second line SHALL show the archived change's last modification datetime with Calendar icon, spec delta count with FileText icon, and task progress (done/total) with CircleCheckBig icon. No progress bar SHALL be shown for archived changes.

#### Scenario: Archived change shows name without date prefix
- **WHEN** the Explorer Pane renders an archived change named "2026-04-06-migrate-svelte5-runes"
- **THEN** the first line shows "migrate-svelte5-runes"
- **AND** the tooltip on hover shows the full name including date prefix

#### Scenario: Archived change shows compact second line with datetime icon
- **WHEN** the Explorer Pane renders an archived change with a lastModified datetime, 3 spec deltas and 5/10 tasks
- **THEN** the second line shows a Calendar icon with the last modification datetime in canonical `YYYY-MM-DD HH:mm` format reflecting the browser's local timezone, a FileText icon with "3", and a CircleCheckBig icon with "5/10"
- **AND** no progress bar is displayed

### Requirement: Spec list shows last modified date with icon
The system SHALL display each spec entry with a Calendar icon and the last modification datetime in canonical `YYYY-MM-DD HH:mm` format.

#### Scenario: Spec shows last modified datetime with calendar icon
- **WHEN** the Explorer Pane renders a spec with a lastModified datetime
- **THEN** the second line shows a Calendar icon followed by the datetime in canonical `YYYY-MM-DD HH:mm` format reflecting the browser's local timezone

### Requirement: Render spec content
The system SHALL load a spec by capability name when the operator clicks it in the Explorer Pane, SHALL open a tab in the Main Viewer rendering `spec.md` content, and SHALL display the spec's last modification datetime using the same compact metadata style as other views: a Calendar icon followed by the canonical `YYYY-MM-DD HH:mm` string when available, or `Specification` as fallback. The SpecViewer heading icon SHALL use the same `FileText`-based success color treatment as the Dashboard Specs summary card so spec surfaces share a consistent visual identity.

#### Scenario: View a capability spec
- **WHEN** the operator clicks a capability that has `spec.md` in the Explorer Pane
- **THEN** a tab opens in the Main Viewer
- **AND** the tab renders the specification content
- **AND** no design sub-tab is shown
- **AND** the header subtitle shows a Calendar icon and the canonical last modification datetime
- **AND** the heading icon uses the shared spec color treatment

### Requirement: Change lastModified includes spec delta file updates
The system SHALL include markdown files under `changes/<name>/specs/` when computing a change's `lastModified`, so ExplorerPane and ChangeViewer surface the newest relevant change update even when only a spec delta file changed.

#### Scenario: Spec delta file is the newest file in a change
- **WHEN** a change's newest modified file is `changes/<name>/specs/<capability>/spec.md`
- **THEN** the parsed change `lastModified` equals that spec delta file's modification time
- **AND** the change still renders spec deltas in the dedicated UI area rather than the regular file groups

### Requirement: SpecViewer can highlight the current search query
The SpecViewer SHALL highlight matching rendered markdown text for the current capability when the Search panel's viewer-highlight toggle is enabled and a valid current search query exists. The highlight SHALL apply across the rendered spec markdown body, SHALL use warning-tone mark styling, and SHALL not introduce next/previous navigation controls, current-match state, or extra viewer-side settings UI.

#### Scenario: Spec body contains the current search query
- **WHEN** the operator opens a capability spec whose rendered markdown body contains the current valid search query and viewer highlighting is enabled
- **THEN** the SpecViewer renders warning-tone highlights for each exact occurrence in the spec markdown body

#### Scenario: Spec renders normally when highlighting is unavailable
- **WHEN** the current spec does not contain the query in its markdown body or viewer highlighting is disabled
- **THEN** the SpecViewer renders its markdown content without in-page highlight marks
