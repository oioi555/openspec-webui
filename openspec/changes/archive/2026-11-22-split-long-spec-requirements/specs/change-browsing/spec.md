## MODIFIED Requirements

### Requirement: List active and archived changes
The system SHALL list active changes in the Explorer Pane's ACTIVE CHANGES section and archived changes in the ARCHIVE section, rendering ACTIVE CHANGES first and sorting both by last modification datetime descending by default (not by archive-date prefix). The operator SHALL be able to switch each section between `Date` and `Name` ordering from its header. Each entry SHALL display the change name and task progress. Only active change entries SHALL display a compact trailing validation icon.

#### Scenario: Show active change summaries in Explorer by default date order
- **WHEN** the workspace contains active changes
- **THEN** the Explorer Pane's ACTIVE CHANGES section lists them from newest to oldest by `lastModified`
- **AND** each entry shows the change name and task progress badge
- **AND** the ACTIVE CHANGES section is rendered before the ARCHIVE section
- **AND** the operator can switch the section between `Date` and `Name` ordering from the section header

#### Scenario: Show archived change summaries in Explorer by default date order
- **WHEN** the workspace contains archived changes
- **THEN** the Explorer Pane's ARCHIVE section lists them from newest to oldest by `lastModified` rather than by archive-date prefix
- **AND** each entry shows the change name

#### Scenario: Sort archived changes by visible name
- **WHEN** the operator selects `Name` ordering in the ARCHIVE section
- **THEN** archived changes are sorted alphabetically by their visible names without the `YYYY-MM-DD-` prefix
- **AND** the comparison key is the visible archived change name with the leading `YYYY-MM-DD-` prefix removed
- **AND** the displayed labels remain trimmed while the full archived change names remain intact for routing and lookup

#### Scenario: Home focuses active changes
- **WHEN** the operator opens Home from the Activity Bar
- **THEN** the Explorer Pane expands the ACTIVE CHANGES section (`Home -> ACTIVE CHANGES`)
- **AND** the ARCHIVE section is collapsed

#### Scenario: Archive focuses archive
- **WHEN** the operator opens Archive from the Activity Bar
- **THEN** the Explorer Pane expands the ARCHIVE section (`Archive -> ARCHIVE`)
- **AND** the ACTIVE CHANGES section is collapsed

#### Scenario: Empty section in Explorer
- **WHEN** the workspace contains no active or archived changes
- **THEN** the corresponding Explorer section shows a placeholder message

#### Scenario: Show active change validation pass state
- **WHEN** the Explorer Pane renders an active change whose latest validation target status is `passed`
- **THEN** the row shows the shared pass icon as a compact trailing status indicator on the first line
- **AND** the rest of the row layout and metadata remain unchanged

#### Scenario: Show active change validation attention state
- **WHEN** the Explorer Pane renders an active change whose latest validation target status is `failed`, `warning`, or `info`
- **THEN** the row shows the corresponding shared validation icon as a compact trailing status indicator on the first line

#### Scenario: Active change validation icon requires available state
- **WHEN** the Explorer Pane renders an active change whose latest validation state is not available
- **THEN** the row does not display a trailing validation icon

#### Scenario: Archived changes never show validation icons
- **WHEN** the Explorer Pane renders an archived change row
- **THEN** the row does not display a trailing validation icon even if a validation result exists for similarly named active items

### Requirement: ChangeViewer can highlight the current search query
The ChangeViewer SHALL highlight matching rendered markdown text in the open change document with warning-tone mark styling when the Search panel's viewer-highlight toggle is enabled and a valid current search query exists. The highlight SHALL apply to the markdown content of the active primary tab. It SHALL NOT add next/previous navigation controls, current-match state, or extra viewer-side settings UI.

#### Scenario: Change document body contains the current search query
- **WHEN** the operator opens a change document whose rendered markdown body contains the current valid search query and viewer highlighting is enabled
- **THEN** the ChangeViewer renders warning-tone highlights for each exact occurrence in that markdown document
- **AND** this applies to rendered proposal, design, tasks, and change spec delta markdown content when the relevant primary tab is active
- **AND** no next/previous navigation controls, current-match state, or extra viewer-side settings UI are shown

#### Scenario: Change metadata match does not produce false in-page highlight
- **WHEN** the current change was opened from a Search result that matched the change name or path but the active markdown document does not contain the query
- **THEN** the ChangeViewer renders the markdown document without in-page highlight marks

#### Scenario: Markdown other file contains the current search query
- **WHEN** the operator opens a change whose Markdown Other File contains the current valid search query and viewer highlighting is enabled
- **THEN** the ChangeViewer renders warning-tone highlights for matching text in that Markdown Other File

#### Scenario: Non-Markdown other file stays readable without highlight
- **WHEN** the operator opens a JSON, YAML, or plain text Other File while viewer highlighting is enabled
- **THEN** the file remains readable
- **AND** it is not required to participate in rendered markdown highlighting
