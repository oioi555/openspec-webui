# spec-browsing Specification

## Purpose
Expose capability specs through the Explorer Pane and open spec content in the tabbed Main Viewer.

## Requirements

### Requirement: Catalog capability specs
The system SHALL discover capability specs recursively under `specs/` at any depth, sort them alphabetically by default, and display them in the Explorer Pane's SPECS collapsible section. Only a directory that directly contains a `spec.md` SHALL count as a capability. Deleted retired spec files SHALL be omitted without errors. The SPECS header SHALL switch between `Name` and `Date` ordering. Spec rows SHALL show a trailing validation icon only for `failed`, `warning`, or `info` status.

#### Scenario: List available capabilities in Explorer by default name order
- **WHEN** the workspace contains one or more spec capability directories
- **THEN** the Explorer Pane's SPECS section lists them in alphabetical order by default
- **AND** each entry shows the capability name

#### Scenario: Discover nested capability specs
- **WHEN** the workspace contains a spec file at `specs/network/auth/` so the full path is `openspec/specs/network/auth/spec.md`
- **THEN** the Explorer Pane's SPECS section lists the nested capability
- **AND** the nested capability renders and opens exactly like a top-level capability
- **AND** nested `openspec/specs/**/spec.md` files at any depth are matched in addition to top-level `specs/<capability>/spec.md` files

#### Scenario: Skip empty parent directories as capabilities
- **WHEN** a directory under `specs/` contains only subdirectories and no direct `spec.md` file
- **THEN** the Explorer Pane's SPECS section does not render that directory as a capability
- **AND** capabilities that do contain a direct `spec.md` deeper in the tree are still listed

#### Scenario: Tolerate deleted retired spec files
- **WHEN** a spec file referenced by a previous scan no longer exists on disk
- **THEN** the system omits the deleted spec from discovery
- **AND** discovery continues without raising an error

#### Scenario: Sort specs by last modification datetime
- **WHEN** the operator selects `Date` ordering from the SPECS section header
- **THEN** the Explorer Pane's SPECS section lists specs from newest to oldest by `lastModified` (last modification datetime descending)

#### Scenario: Switch back to name ordering
- **WHEN** the operator selects `Name` ordering from the SPECS section header
- **THEN** the SPECS section lists specs alphabetically

#### Scenario: Show an empty spec list in Explorer
- **WHEN** the workspace contains no spec capability directories
- **THEN** the Explorer Pane's SPECS section shows `No specs found`

#### Scenario: Show spec validation attention icon
- **WHEN** the Explorer Pane renders a spec whose latest validation target status is `failed`, `warning`, or `info`
- **THEN** the row shows the corresponding shared validation icon as a compact trailing status indicator on the first line

#### Scenario: Hide spec pass icon
- **WHEN** the Explorer Pane renders a spec whose latest validation target status is `passed`
- **THEN** the row does not display a trailing validation icon
- **AND** the list remains focused on attention states rather than successful validation noise

#### Scenario: Hide non-actionable spec validation states
- **WHEN** the Explorer Pane renders a spec whose latest validation target status is `not-run`, `stale`, or `unknown`
- **THEN** the row does not display a trailing validation icon

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
The system SHALL load a spec by capability name when the operator clicks it in the Explorer Pane, SHALL open a Main Viewer tab rendering `spec.md`, and SHALL display the spec's last modification datetime in the compact metadata style of other views. The SpecViewer heading icon SHALL use the same `FileText`-based success color treatment as the Dashboard Specs summary card so spec surfaces share a consistent visual identity.

#### Scenario: View a capability spec
- **WHEN** the operator clicks a capability that has `spec.md` in the Explorer Pane
- **THEN** a tab opens in the Main Viewer
- **AND** the tab renders the specification content
- **AND** no design sub-tab is shown
- **AND** the header subtitle shows a Calendar icon and the canonical `YYYY-MM-DD HH:mm` last modification datetime
- **AND** when no datetime is available the subtitle falls back to `Specification`
- **AND** the heading icon uses the shared spec color treatment

### Requirement: Catalog change spec deltas
The system SHALL discover spec deltas recursively at any depth under each change's `specs/`. Only a directory that directly contains a `spec.md` SHALL count as a spec delta, identified by its `/`-separated path relative to the change's `specs/`. Deleted retired deltas SHALL be omitted without errors. Deltas SHALL be sorted alphabetically by identity, shown in the Spec Deltas UI, and counted in Explorer Pane and Dashboard. Deltas SHALL NOT be rendered as change file groups or Other Files.

#### Scenario: Discover nested change spec deltas
- **WHEN** a change contains a spec delta at `specs/network/auth/` so the full path is `openspec/changes/<name>/specs/network/auth/spec.md`
- **THEN** the parsed change includes that spec delta
- **AND** its capability identity is `network/auth`
- **AND** ChangeViewer Spec Deltas lists it with that capability identity
- **AND** nested `changes/<name>/specs/**/spec.md` files at any depth are matched in addition to top-level `changes/<name>/specs/<capability>/spec.md` files

#### Scenario: Skip empty parent directories as spec deltas
- **WHEN** a change's `specs/network/` directory contains only nested directories and no direct `spec.md`
- **THEN** `network` is not counted as a spec delta
- **AND** deeper deltas that do contain a direct `spec.md` are still discovered

#### Scenario: Mix top-level and nested spec deltas
- **WHEN** a change contains both `specs/explorer-pane/spec.md` and `specs/network/auth/spec.md`
- **THEN** the change includes both spec deltas
- **AND** Explorer Pane and Dashboard spec delta counts equal `2`
- **AND** the Spec Deltas list is sorted alphabetically by capability identity as `explorer-pane` then `network/auth`

#### Scenario: Tolerate deleted retired spec delta files
- **WHEN** a spec delta file referenced by a previous scan no longer exists on disk
- **THEN** the system omits the deleted spec delta from discovery
- **AND** discovery continues without raising an error

#### Scenario: Nested spec deltas stay out of file groups and Other Files
- **WHEN** a change contains a nested spec delta at `specs/network/auth/spec.md` and a non-standard `notes.md` in the change root
- **THEN** selecting Spec Deltas shows the nested spec delta content
- **AND** the nested `spec.md` is not listed as a regular change file or an Other File

### Requirement: Change lastModified includes spec delta file updates
The system SHALL include markdown files under `changes/<name>/specs/` at any depth when computing a change's `lastModified`, so ExplorerPane and ChangeViewer surface the newest relevant change update even when only a spec delta file changed.

#### Scenario: Spec delta file is the newest file in a change
- **WHEN** a change's newest modified file is `changes/<name>/specs/<capability>/spec.md`
- **THEN** the parsed change `lastModified` equals that spec delta file's modification time
- **AND** the change still renders spec deltas in the dedicated UI area rather than the regular file groups

#### Scenario: Nested spec delta file is the newest file in a change
- **WHEN** a change's newest modified file is `changes/<name>/specs/network/auth/spec.md`
- **THEN** the parsed change `lastModified` equals that nested spec delta file's modification time
- **AND** the nested spec delta still renders in the dedicated Spec Deltas UI rather than the regular file groups

### Requirement: SpecViewer can highlight the current search query
The SpecViewer SHALL highlight matching rendered markdown text for the current capability when the Search panel's viewer-highlight toggle is enabled and a valid current search query exists. The highlight SHALL apply across the rendered spec markdown body, SHALL use warning-tone mark styling, and SHALL not introduce next/previous navigation controls, current-match state, or extra viewer-side settings UI.

#### Scenario: Spec body contains the current search query
- **WHEN** the operator opens a capability spec whose rendered markdown body contains the current valid search query and viewer highlighting is enabled
- **THEN** the SpecViewer renders warning-tone highlights for each exact occurrence in the spec markdown body

#### Scenario: Spec renders normally when highlighting is unavailable
- **WHEN** the current spec does not contain the query in its markdown body or viewer highlighting is disabled
- **THEN** the SpecViewer renders its markdown content without in-page highlight marks

### Requirement: Parse delta operations with OpenSpec header rules
When parsing a change spec delta into operations, the system SHALL follow OpenSpec 2.1:
- A requirement header SHALL match `###`, optional whitespace, then `Requirement:`.
- A closing `#` run after a space or tab SHALL be dropped from names.
- Fenced lines SHALL NOT be headers.
- A BOM and CRLF endings SHALL NOT change the result.
- Any `##` header SHALL end the current section.
- A leading YAML frontmatter block SHALL be ignored.
- Requirement content SHALL have no trailing whitespace.

#### Scenario: Header without a space
- **WHEN** an ADDED section contains `###Requirement: Compact header`
- **THEN** the operations include an added requirement named `Compact header`

#### Scenario: Closing run of hashes
- **WHEN** a delta contains `## MODIFIED Requirements ##` followed by `### Requirement: Foo ###`
- **THEN** the operations include a modified requirement named `Foo`

#### Scenario: Header example in a code fence
- **WHEN** a requirement body contains a fenced code block with the line `### Requirement: Example`
- **THEN** no separate requirement named `Example` is produced
- **AND** the fenced lines stay in the enclosing requirement's content

#### Scenario: CRLF file
- **WHEN** a delta file uses CRLF line endings
- **THEN** its operations equal those of the same file with LF line endings

#### Scenario: Non-delta section
- **WHEN** a requirement is followed by `## Notes` and text
- **THEN** that text is not in the requirement's content

#### Scenario: Frontmatter
- **WHEN** a delta starts with a `---` block holding `owner: a`
- **THEN** no frontmatter text appears in any requirement content
- **AND** line numbers still match the file

#### Scenario: Trailing blank lines
- **WHEN** a requirement block ends with blank lines
- **THEN** its content ends at its last non-blank line

#### Scenario: Singular section header
- **WHEN** a delta uses `## ADDED Requirement`
- **THEN** its requirements are still parsed as added
