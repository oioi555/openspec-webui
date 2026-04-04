## ADDED Requirements

### Requirement: Catalog capability specs
The system SHALL discover capability directories under `specs/`, sort them alphabetically, and expose whether each capability includes `design.md` alongside `spec.md`.

#### Scenario: List available capabilities
- **WHEN** the workspace contains one or more spec capability directories
- **THEN** the system returns them in alphabetical order
- **AND** indicates for each capability whether design content is available

#### Scenario: Show an empty spec list
- **WHEN** the workspace contains no spec capability directories
- **THEN** the system returns an empty spec collection
- **AND** the UI shows `No specifications found`

### Requirement: Render spec and design content
The system SHALL load a spec by capability name, SHALL render `spec.md` content in the detail view, and SHALL offer `Specification` and `Design` tabs when `design.md` is present.

#### Scenario: View a capability with design content
- **WHEN** the operator opens a capability that has both `spec.md` and `design.md`
- **THEN** the detail view renders the specification content by default
- **AND** provides a `Design` tab for the design document

#### Scenario: View a capability without design content
- **WHEN** the operator opens a capability that only has `spec.md`
- **THEN** the detail view renders the specification content
- **AND** does not show a design tab

#### Scenario: Surface an incomplete capability directory
- **WHEN** a capability directory exists without `spec.md`
- **THEN** the system still exposes the capability
- **AND** returns an empty specification body for that capability
