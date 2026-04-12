## MODIFIED Requirements

### Requirement: Render spec and design content
The system SHALL load a spec by capability name when the operator clicks it in the Explorer Pane, SHALL open a tab in the Main Viewer rendering `spec.md` content, and SHALL offer `Specification` and `Design` sub-tabs when `design.md` is present. The SpecViewer header subtitle SHALL display the spec's last modification date using the same compact metadata style as other views: a Calendar icon followed by the formatted date when available, or `Specification` as fallback. The SpecViewer heading icon SHALL use the same `FileText`-based success color treatment as the Dashboard Specs summary card so spec surfaces share a consistent visual identity.

#### Scenario: View a capability with design content
- **WHEN** the operator clicks a capability that has both `spec.md` and `design.md` in the Explorer Pane
- **THEN** a tab opens in the Main Viewer
- **AND** the tab renders the specification content by default
- **AND** provides a Design sub-tab for the design document
- **AND** the header subtitle shows a Calendar icon and the formatted last modification date
- **AND** the heading icon uses the shared spec color treatment

#### Scenario: View a capability without design content
- **WHEN** the operator clicks a capability that only has `spec.md`
- **THEN** a tab opens rendering the specification content
- **AND** no design sub-tab is shown
- **AND** the header subtitle shows a Calendar icon and the formatted spec modification date
- **AND** the heading icon uses the shared spec color treatment
