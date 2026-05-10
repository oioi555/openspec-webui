## ADDED Requirements

### Requirement: SpecViewer scrolls to the first search hit on Search-opened navigation
When the operator opens a spec from the Search panel and the result includes a markdown-body hit target, the SpecViewer SHALL scroll the first highlighted match for the current search query into view after the spec markdown has rendered. This auto-scroll SHALL occur only for Search-driven navigation with a real body hit, and SHALL not introduce additional next/previous navigation controls or viewer chrome.

#### Scenario: Search-opened spec scrolls to first highlighted match
- **WHEN** the operator opens a spec Search result whose markdown body contains the current search query
- **THEN** the SpecViewer renders the highlighted markdown body
- **AND** the first highlighted match is scrolled into view automatically

#### Scenario: Metadata-only spec result does not fake scroll targeting
- **WHEN** the operator opens a spec Search result that matched only the spec name and not the markdown body
- **THEN** the SpecViewer opens normally
- **AND** it does not attempt to scroll to a nonexistent highlighted match
