## MODIFIED Requirements

### Requirement: ChangeViewer can highlight the current search query
The ChangeViewer SHALL highlight matching rendered markdown text for the current open change document when the Search panel's viewer-highlight toggle is enabled and a valid current search query exists. The highlight SHALL apply to rendered proposal, design, tasks, change spec delta markdown content, and Markdown-formatted Other Files when the relevant primary tab is active. The highlight SHALL use warning-tone mark styling, and SHALL not introduce next/previous navigation controls, current-match state, or extra viewer-side settings UI. Non-Markdown Other Files such as JSON, YAML, and plain text SHALL remain readable but are not required to participate in rendered markdown highlighting.

#### Scenario: Change document body contains the current search query
- **WHEN** the operator opens a change document whose rendered markdown body contains the current valid search query and viewer highlighting is enabled
- **THEN** the ChangeViewer renders warning-tone highlights for each exact occurrence in that markdown document

#### Scenario: Change metadata match does not produce false in-page highlight
- **WHEN** the current change was opened from a Search result that matched the change name or path but the active markdown document does not contain the query
- **THEN** the ChangeViewer renders the markdown document without in-page highlight marks

#### Scenario: Markdown other file contains the current search query
- **WHEN** the operator opens a change whose Markdown Other File contains the current valid search query and viewer highlighting is enabled
- **THEN** the ChangeViewer renders warning-tone highlights for matching text in that Markdown Other File
