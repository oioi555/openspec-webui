## MODIFIED Requirements

### Requirement: Catalog capability specs
The system SHALL discover capability specs recursively under `specs/`, matching nested `openspec/specs/**/spec.md` files at any depth in addition to top-level `specs/<capability>/spec.md` files, sort them alphabetically by default, and display them in the Explorer Pane's SPECS collapsible section. A directory that directly contains a `spec.md` file SHALL count as a capability; a parent directory that contains only nested directories and no direct `spec.md` SHALL NOT be rendered as a capability. The system SHALL tolerate deleted retired spec files by omitting them from discovery without errors. The operator SHALL be able to switch the SPECS section between `Name` ordering and `Date` ordering from the section header. When `Date` ordering is selected, specs SHALL be sorted by last modification datetime descending. Spec rows SHALL display a compact trailing validation icon only when the latest validation target status for that spec is `failed`, `warning`, or `info`.

#### Scenario: List available capabilities in Explorer by default name order
- **WHEN** the workspace contains one or more spec capability directories
- **THEN** the Explorer Pane's SPECS section lists them in alphabetical order by default
- **AND** each entry shows the capability name

#### Scenario: Discover nested capability specs
- **WHEN** the workspace contains a spec file at `specs/network/auth/` so the full path is `openspec/specs/network/auth/spec.md`
- **THEN** the Explorer Pane's SPECS section lists the nested capability
- **AND** the nested capability renders and opens exactly like a top-level capability

#### Scenario: Skip empty parent directories as capabilities
- **WHEN** a directory under `specs/` contains only subdirectories and no direct `spec.md` file
- **THEN** the Explorer Pane's SPECS section does not render that directory as a capability
- **AND** capabilities that do contain a direct `spec.md` deeper in the tree are still listed

#### Scenario: Tolerate deleted retired spec files
- **WHEN** a spec file referenced by a previous scan no longer exists on disk
- **THEN** the system omits the deleted spec from discovery
- **AND** discovery continues without raising an error

#### Scenario: Sort specs by last modification datetime
- **WHEN** the operator selects `Date` ordering in the SPECS section
- **THEN** the Explorer Pane's SPECS section lists specs from newest to oldest by `lastModified`

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
