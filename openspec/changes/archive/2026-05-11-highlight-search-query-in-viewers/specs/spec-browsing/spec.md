## ADDED Requirements

### Requirement: SpecViewer can highlight the current search query
The SpecViewer SHALL highlight matching rendered markdown text for the current capability when the Search panel's viewer-highlight toggle is enabled and a valid current search query exists. The highlight SHALL apply across the rendered spec markdown body, SHALL use warning-tone mark styling, and SHALL not introduce next/previous navigation controls, current-match state, or extra viewer-side settings UI.

#### Scenario: Spec body contains the current search query
- **WHEN** the operator opens a capability spec whose rendered markdown body contains the current valid search query and viewer highlighting is enabled
- **THEN** the SpecViewer renders warning-tone highlights for each exact occurrence in the spec markdown body

#### Scenario: Spec renders normally when highlighting is unavailable
- **WHEN** the current spec does not contain the query in its markdown body or viewer highlighting is disabled
- **THEN** the SpecViewer renders its markdown content without in-page highlight marks
