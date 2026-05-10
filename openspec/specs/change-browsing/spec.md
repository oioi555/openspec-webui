# change-browsing Specification

## Purpose
Expose active and archived changes through the Explorer Pane so operators can move from current work to historical reference within the three-pane layout.

## Requirements
### Requirement: List active and archived changes
The system SHALL list active changes in the Explorer Pane's ACTIVE CHANGES collapsible section, sorted by last modification datetime descending by default. The system SHALL list archived changes in the Explorer Pane's ARCHIVE collapsible section, also sorted by last modification datetime descending by default rather than by archive-date prefix. The operator SHALL be able to switch both ACTIVE CHANGES and ARCHIVE between `Date` ordering and `Name` ordering from the section header. When `Name` ordering is selected for archived changes, the comparison key SHALL be the visible archived change name with the leading `YYYY-MM-DD-` prefix removed. The ACTIVE CHANGES section SHALL be rendered before the ARCHIVE section so the workflow reads from active work to historical reference. Each entry SHALL display the change name and task progress. The Activity Bar SHALL align with these sections as `Home -> ACTIVE CHANGES` and `Archive -> ARCHIVE`.

#### Scenario: Show active change summaries in Explorer by default date order
- **WHEN** the workspace contains active changes
- **THEN** the Explorer Pane's ACTIVE CHANGES section lists them from newest to oldest by `lastModified`
- **AND** each entry shows the change name and task progress badge

#### Scenario: Show archived change summaries in Explorer by default date order
- **WHEN** the workspace contains archived changes
- **THEN** the Explorer Pane's ARCHIVE section lists them from newest to oldest by `lastModified`
- **AND** each entry shows the change name

#### Scenario: Sort archived changes by visible name
- **WHEN** the operator selects `Name` ordering in the ARCHIVE section
- **THEN** archived changes are sorted alphabetically by their visible names without the `YYYY-MM-DD-` prefix
- **AND** the displayed labels remain trimmed while the full archived change names remain intact for routing and lookup

#### Scenario: Home focuses active changes
- **WHEN** the operator opens Home from the Activity Bar
- **THEN** the Explorer Pane expands the ACTIVE CHANGES section
- **AND** the ARCHIVE section is collapsed

#### Scenario: Archive focuses archive
- **WHEN** the operator opens Archive from the Activity Bar
- **THEN** the Explorer Pane expands the ARCHIVE section
- **AND** the ACTIVE CHANGES section is collapsed

#### Scenario: Empty section in Explorer
- **WHEN** the workspace contains no active or archived changes
- **THEN** the corresponding Explorer section shows a placeholder message

### Requirement: ChangeViewer can highlight the current search query
The ChangeViewer SHALL highlight matching rendered markdown text for the current open change document when the Search panel's viewer-highlight toggle is enabled and a valid current search query exists. The highlight SHALL apply to rendered proposal, design, tasks, and change spec delta markdown content, SHALL use warning-tone mark styling, and SHALL not introduce next/previous navigation controls, current-match state, or extra viewer-side settings UI.

#### Scenario: Change document body contains the current search query
- **WHEN** the operator opens a change document whose rendered markdown body contains the current valid search query and viewer highlighting is enabled
- **THEN** the ChangeViewer renders warning-tone highlights for each exact occurrence in that markdown document

#### Scenario: Change metadata match does not produce false in-page highlight
- **WHEN** the current change was opened from a Search result that matched the change name or path but the active markdown document does not contain the query
- **THEN** the ChangeViewer renders the markdown document without in-page highlight marks
