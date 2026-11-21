## MODIFIED Requirements

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
