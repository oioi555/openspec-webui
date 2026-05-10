## ADDED Requirements

### Requirement: Search query can drive optional in-page viewer highlighting
When the Search panel's viewer-highlight toggle is enabled and the current query is valid, the system SHALL use that query as the in-page highlight term for rendered markdown viewers opened in the Main Viewer. The system SHALL treat the query as one literal string, SHALL highlight exact string matches case-insensitively while preserving the original document text, and SHALL remove or suppress those highlights when the query becomes shorter than the Search minimum length or the toggle is disabled. Search results based on filenames, paths, or other metadata SHALL continue to appear in the Search panel, but SHALL NOT create in-page highlights unless the same query also appears in the markdown body.

#### Scenario: Open a result whose markdown body contains the query
- **WHEN** the operator opens a search result whose rendered markdown body contains the current valid query and viewer highlighting is enabled
- **THEN** the Main Viewer highlights each exact occurrence of that query in the markdown body

#### Scenario: Metadata-only match does not create viewer highlight
- **WHEN** a search result appears because the query matched a filename or path but the opened markdown body does not contain that query
- **THEN** the Search panel still shows the result
- **AND** the opened viewer renders without in-page highlights

#### Scenario: Disable highlighting while a highlighted document is open
- **WHEN** the operator disables the Search panel's viewer-highlight toggle while viewing a highlighted markdown document
- **THEN** the in-page highlights are removed without clearing the current search query or result list
