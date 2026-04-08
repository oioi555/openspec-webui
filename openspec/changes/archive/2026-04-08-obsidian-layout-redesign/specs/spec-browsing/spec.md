## MODIFIED Requirements

### Requirement: Catalog capability specs
The system SHALL discover capability directories under `specs/`, sort them alphabetically, and display them in the Explorer Pane's SPECS collapsible section. Each entry SHALL indicate whether the spec includes a design document.

#### Scenario: List available capabilities in Explorer
- **WHEN** the workspace contains one or more spec capability directories
- **THEN** the Explorer Pane's SPECS section lists them in alphabetical order
- **AND** each entry shows the capability name
- **AND** entries with design content are visually distinguished

#### Scenario: Show an empty spec list in Explorer
- **WHEN** the workspace contains no spec capability directories
- **THEN** the Explorer Pane's SPECS section shows "No specifications found"

### Requirement: Render spec and design content
The system SHALL load a spec by capability name when the operator clicks it in the Explorer Pane, SHALL open a tab in the Main Viewer rendering `spec.md` content, and SHALL offer `Specification` and `Design` sub-tabs when `design.md` is present.

#### Scenario: View a capability with design content
- **WHEN** the operator clicks a capability that has both `spec.md` and `design.md` in the Explorer Pane
- **THEN** a tab opens in the Main Viewer
- **AND** the tab renders the specification content by default
- **AND** provides a Design sub-tab for the design document

#### Scenario: View a capability without design content
- **WHEN** the operator clicks a capability that only has `spec.md`
- **THEN** a tab opens rendering the specification content
- **AND** no design sub-tab is shown
