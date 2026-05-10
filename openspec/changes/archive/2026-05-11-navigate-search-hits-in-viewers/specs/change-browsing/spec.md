## MODIFIED Requirements

### Requirement: ChangeViewer can highlight the current search query
The ChangeViewer SHALL highlight matching rendered markdown text for the current open change document when the Search panel's viewer-highlight toggle is enabled and a valid current search query exists. When the operator opens a change from the Search panel and the result includes markdown-body hit metadata, the ChangeViewer SHALL open the first matching top-level markdown document or the Spec Deltas tab before scrolling to the first highlighted match. The ChangeViewer SHALL show warning-tone hit-presence indicators on top-level document tabs that contain hits for the current Search-opened change result. When the matching target is within Spec Deltas, the ChangeViewer SHALL auto-expand only the matching spec delta sections and SHALL show warning-tone hit counts on those section headers. The viewer SHALL not introduce next/previous navigation controls, current-match state, or extra viewer-side settings UI.

#### Scenario: Search-opened change lands on the first matching document
- **WHEN** the operator opens a change Search result whose first body hit is in `design.md`
- **THEN** the ChangeViewer selects the design document tab automatically
- **AND** the first highlighted match in that document is scrolled into view

#### Scenario: Search-opened change lands in matching spec deltas
- **WHEN** the operator opens a change Search result whose first body hit is in spec delta capability `search`
- **THEN** the ChangeViewer opens the Spec Deltas tab automatically
- **AND** the matching `search` delta section is expanded
- **AND** the first highlighted match inside that delta is scrolled into view

#### Scenario: Change tab indicators show which top-level documents contain hits
- **WHEN** the current Search-opened change result contains hits in proposal and tasks but not design
- **THEN** the ChangeViewer shows warning-tone hit indicators on the proposal and tasks top-level tabs
- **AND** the design tab remains without a hit indicator

#### Scenario: Change metadata match does not produce false in-page routing
- **WHEN** the current change was opened from a Search result that matched only the change name or path
- **THEN** the ChangeViewer opens with its normal default tab behavior
- **AND** it does not show false top-level hit indicators or auto-scroll to a nonexistent highlighted match
