# Spec Delta

## MODIFIED Requirements

### Requirement: Catalog capability specs
The system SHALL discover capability specs recursively under `specs/` at any depth, sort them alphabetically by default, and display them in the Specs panel tree. Only a directory that directly contains a `spec.md` SHALL count as a capability. Deleted retired spec files SHALL be omitted without errors. The Specs panel header SHALL switch between `Name` and `Date` ordering. Spec rows SHALL show a trailing validation icon only for `failed`, `warning`, or `info` status.

#### Scenario: List available capabilities in Explorer by default name order
- **WHEN** the workspace contains one or more spec capability directories
- **THEN** the Specs panel lists them in alphabetical order by default
- **AND** each entry shows the capability name

#### Scenario: Discover nested capability specs
- **WHEN** the workspace contains a spec file at `specs/network/auth/` so the full path is `openspec/specs/network/auth/spec.md`
- **THEN** the Specs panel lists the nested capability under an expandable `network` folder
- **AND** the nested capability opens exactly like a top-level capability
- **AND** nested `openspec/specs/**/spec.md` files at any depth are matched in addition to top-level `specs/<capability>/spec.md` files

#### Scenario: Skip empty parent directories as capabilities
- **WHEN** a directory under `specs/` contains only subdirectories and no direct `spec.md` file
- **THEN** the Specs panel renders that directory only as a folder, not as an openable capability
- **AND** capabilities that do contain a direct `spec.md` deeper in the tree are still listed

#### Scenario: Tolerate deleted retired spec files
- **WHEN** a spec file referenced by a previous scan no longer exists on disk
- **THEN** the system omits the deleted spec from discovery
- **AND** discovery continues without raising an error

#### Scenario: Sort specs by last modification datetime
- **WHEN** the operator selects `Date` ordering from the Specs panel header
- **THEN** the Specs panel lists specs within each folder from newest to oldest by `lastModified` (last modification datetime descending)

#### Scenario: Switch back to name ordering
- **WHEN** the operator selects `Name` ordering from the Specs panel header
- **THEN** the Specs panel lists specs within each folder alphabetically

#### Scenario: Show an empty spec list in Explorer
- **WHEN** the workspace contains no spec capability directories
- **THEN** the Specs panel shows `No specs found`

#### Scenario: Show spec validation attention icon
- **WHEN** the Specs panel renders a spec whose latest validation target status is `failed`, `warning`, or `info`
- **THEN** the row shows the corresponding shared validation icon as a compact trailing status indicator on the first line

#### Scenario: Hide spec pass icon
- **WHEN** the Specs panel renders a spec whose latest validation target status is `passed`
- **THEN** the row does not display a trailing validation icon
- **AND** the list remains focused on attention states rather than successful validation noise

#### Scenario: Hide non-actionable spec validation states
- **WHEN** the Specs panel renders a spec whose latest validation target status is `not-run`, `stale`, or `unknown`
- **THEN** the row does not display a trailing validation icon

### Requirement: Spec list shows last modified date with icon
The system SHALL display each spec entry with a Calendar icon and the last modification datetime in canonical `YYYY-MM-DD HH:mm` format.

#### Scenario: Spec shows last modified datetime with calendar icon
- **WHEN** the Specs panel renders a spec with a lastModified datetime
- **THEN** the second line shows a Calendar icon followed by the datetime in canonical `YYYY-MM-DD HH:mm` format reflecting the browser's local timezone
