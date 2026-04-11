## ADDED Requirements

### Requirement: Active change display uses compact format with progress
The system SHALL display active changes with a compact second line showing the last modification date with Calendar icon, spec delta count with FileText icon, and task progress (done/total) with CheckSquare icon. The progress bar SHALL be displayed with a narrow width alongside the icon indicators.

#### Scenario: Active change shows compact second line with progress bar
- **WHEN** the Explorer Pane renders an active change with lastModified "2026-04-10", 3 spec deltas and 5/10 tasks
- **THEN** the second line shows a Calendar icon with "2026-04-10", a FileText icon with "3", a CheckSquare icon with "5/10"
- **AND** a narrow progress bar is displayed on the right side

### Requirement: Archive change display uses compact format
The system SHALL display archived changes with the date prefix (YYYY-MM-DD-) stripped from the name. The second line SHALL show the archived date with Calendar icon, spec delta count with FileText icon, and task progress (done/total) with CheckSquare icon. No progress bar SHALL be shown for archived changes.

#### Scenario: Archived change shows name without date prefix
- **WHEN** the Explorer Pane renders an archived change named "2026-04-06-migrate-svelte5-runes"
- **THEN** the first line shows "migrate-svelte5-runes"
- **AND** the tooltip on hover shows the full name including date prefix

#### Scenario: Archived change shows compact second line with date icon
- **WHEN** the Explorer Pane renders an archived change archived on 2026-04-06 with 3 spec deltas and 5/10 tasks
- **THEN** the second line shows a Calendar icon with "2026-04-06", a FileText icon with "3", and a CheckSquare icon with "5/10"
- **AND** no progress bar is displayed

### Requirement: Spec list shows last modified date with icon
The system SHALL display each spec entry with a Calendar icon and the last modification date in YYYY-MM-DD format on the second line.

#### Scenario: Spec shows last modified date with calendar icon
- **WHEN** the Explorer Pane renders a spec with lastModified "2026-04-08"
- **THEN** the second line shows a Calendar icon followed by "2026-04-08"

## MODIFIED Requirements

### Requirement: Render spec and design content
The system SHALL load a spec by capability name when the operator clicks it in the Explorer Pane, SHALL open a tab in the Main Viewer rendering `spec.md` content, and SHALL offer `Specification` and `Design` sub-tabs when `design.md` is present. The SpecViewer header subtitle SHALL display the spec's last modification date using the same compact metadata style as other views: a Calendar icon followed by the formatted date when available, or "Specification" as fallback.

#### Scenario: View a capability with design content
- **WHEN** the operator clicks a capability that has both `spec.md` and `design.md` in the Explorer Pane
- **THEN** a tab opens in the Main Viewer
- **AND** the tab renders the specification content by default
- **AND** provides a Design sub-tab for the design document
- **AND** the header subtitle shows a Calendar icon and the formatted last modification date

#### Scenario: View a capability without design content
- **WHEN** the operator clicks a capability that only has `spec.md`
- **THEN** a tab opens rendering the specification content
- **AND** no design sub-tab is shown
- **AND** the header subtitle shows a Calendar icon and the formatted spec modification date

### Requirement: Change lastModified includes spec delta file updates
The system SHALL include markdown and html files under `changes/<name>/specs/` when computing a change's `lastModified`, so ExplorerPane and ChangeViewer surface the newest relevant change update even when only a spec delta file changed.

#### Scenario: Spec delta file is the newest file in a change
- **WHEN** a change's newest modified file is `changes/<name>/specs/<capability>/spec.md`
- **THEN** the parsed change `lastModified` equals that spec delta file's modification time
- **AND** the change still renders spec deltas in the dedicated UI area rather than the regular file groups
