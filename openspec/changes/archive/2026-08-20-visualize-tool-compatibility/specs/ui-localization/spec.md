## ADDED Requirements

### Requirement: Localize the tool compatibility reference dialog
The system SHALL localize the dialog title, description, view labels, search labels and empty states, field labels, access-mode labels, scope labels, evidence-kind labels, provenance labels, warnings, close-control accessibility text, and responsive presentation copy in every supported locale. Product names, OpenSpec tool ids, commands, invocation forms, filesystem paths, version strings, and URLs SHALL remain unchanged.

#### Scenario: Render the dialog in Japanese
- **WHEN** the active locale is `ja` and the operator opens both reference views
- **THEN** all explanatory, classification, search, provenance, and accessibility copy renders in Japanese
- **AND** product names, ids, paths, and command tokens remain unchanged

#### Scenario: Switch locale while the dialog is open
- **WHEN** the operator changes the active locale while the reference dialog remains open
- **THEN** visible dialog copy and access-mode labels update without closing the dialog
- **AND** current search text and selected reference view are preserved

#### Scenario: Maintain catalog parity
- **WHEN** localization source catalogs are validated
- **THEN** every supported locale contains the complete tool-reference message-key set
- **AND** every value is non-empty and passes the existing locale-content checks
