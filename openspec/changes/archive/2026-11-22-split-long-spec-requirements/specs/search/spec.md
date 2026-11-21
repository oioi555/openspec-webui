## MODIFIED Requirements

### Requirement: Provide debounced workspace search from Activity Bar
The system SHALL expose search from the Activity Bar's Search icon. The search SHALL debounce requests and SHALL suppress queries shorter than two characters, clearing any displayed results. Changing or clearing the active project SHALL clear the query and results immediately. The system SHALL ignore stale debounced timers and async responses for an outdated query or a previous active project. Search results SHALL be displayed in a persistent Search panel in the Explorer Pane.

#### Scenario: Open search from Activity Bar
- **WHEN** the operator clicks the Search icon in the Activity Bar
- **THEN** the Explorer Pane opens if collapsed
- **AND** the Explorer Pane switches from the Active Changes/Archive/Specs group to the Search panel
- **AND** the search input is focused and ready for typing

#### Scenario: Ignore a short query
- **WHEN** the operator enters fewer than two characters in the search input
- **THEN** the system clears the visible search results
- **AND** does not issue a search request

#### Scenario: Clear results when query becomes short
- **WHEN** the operator deletes characters so the query becomes shorter than two characters after previously having results
- **THEN** the system clears the visible search results immediately
- **AND** does not issue a new search request

#### Scenario: Debounce a valid query
- **WHEN** the operator enters a query with at least two characters
- **THEN** the system waits for the debounce interval before issuing the search request
- **AND** shows the returned results in the Search panel of the Explorer Pane

#### Scenario: Ignore stale search results after the query changes
- **WHEN** the operator enters a valid query and then changes or shortens it before the older search response resolves
- **THEN** only the latest matching query may update the visible search results
- **AND** any older response is ignored

#### Scenario: Clear search state on project switch
- **WHEN** the operator switches to a different active project while the Search panel still has a query or visible results
- **THEN** the system clears the search input and visible Search results during project-scoped reinitialization
- **AND** the Search panel does not preserve results from the previous project

#### Scenario: Clear search state when the active project is cleared
- **WHEN** the active project is cleared while the Search panel has a query or visible results
- **THEN** the system clears the search input and visible Search results immediately

#### Scenario: Ignore stale search work after a project switch
- **WHEN** a Search timer or request created under project A is still pending when the operator switches to project B
- **THEN** any timer or async response associated with project A is ignored
- **AND** the Search panel in project B remains empty until the operator enters a new valid query

### Requirement: Search the supported content sources only
The system SHALL search project markdown, spec markdown, and change proposal markdown, and SHALL also match each source's document name and path/file identifier. Spec and change search SHALL include nested spec files at any depth. The system SHALL return each hit with a result type, result name, and excerpt. A metadata-only match SHALL still return the document once, with preview data that explains the metadata match.

#### Scenario: Return a spec match from the spec name
- **WHEN** the query matches a capability spec name even if the query does not appear in that spec's markdown body
- **THEN** the system returns a single `spec` result for that capability
- **AND** the result preview explains the metadata match instead of showing an unrelated body excerpt

#### Scenario: Return a match from a nested spec
- **WHEN** the query matches the markdown body or name of a spec located at a nested path such as `openspec/specs/network/auth/spec.md`
- **THEN** the system returns a single `spec` result for the nested capability
- **AND** selecting the result opens the same nested spec detail view as browsing it from the Explorer Pane
- **AND** nested `openspec/specs/**/spec.md` files at any depth are searched in addition to top-level `specs/<capability>/spec.md` files

#### Scenario: Return a match from a nested change spec delta
- **WHEN** the query matches the markdown body of a spec delta located at a nested path such as `openspec/changes/<name>/specs/network/auth/spec.md`
- **THEN** the system returns a single `change` result for that change
- **AND** selecting the result opens ChangeViewer Spec Deltas for the nested capability `network/auth`
- **AND** spec delta markdown under `changes/<name>/specs/**/spec.md` at any depth is searched in addition to top-level `changes/<name>/specs/<capability>/spec.md` files

#### Scenario: Return a nested change spec delta from capability-path metadata
- **WHEN** the query matches a nested spec delta's capability identity or path even if the query does not appear in that delta's markdown body
- **THEN** the system returns a single `change` result for that change
- **AND** the result preview explains the metadata match instead of showing an unrelated body excerpt

#### Scenario: Return a change match from source metadata
- **WHEN** the query matches a change's source name or path even if the query does not appear in the proposal body
- **THEN** the system returns a single `change` result for that change
- **AND** selecting the result still opens the same change detail tab as before

#### Scenario: Deduplicate combined content and metadata matches
- **WHEN** a query matches both a supported document's metadata and its markdown body
- **THEN** the system returns that document only once in the Search result list
- **AND** existing result navigation behavior remains unchanged

### Requirement: Search results distinguish archived changes
The system SHALL distinguish archived change results from active change results when rendering mixed Search panel output. Change results SHALL use archived-change or active-change visual semantics according to the change their name corresponds to. Result rows SHALL mirror the inline validation-icon rules of the resolved target kind. Search result selection and tab-opening behavior SHALL remain unchanged.

#### Scenario: Render active change search result with pass icon
- **WHEN** the Search panel displays a `change` result whose name belongs to an active change and that change's latest validation target status is `passed`
- **THEN** the result uses the shared active-change indicator semantics
- **AND** it also shows the shared pass icon as a compact trailing validation indicator

#### Scenario: Render active change search result with attention icon
- **WHEN** the Search panel displays an active `change` result whose latest validation target status is `failed`, `warning`, or `info`
- **THEN** the result shows the corresponding shared validation icon as a compact trailing validation indicator

#### Scenario: Render spec search result with attention icon
- **WHEN** the Search panel displays a `spec` result whose latest validation target status is `failed`, `warning`, or `info`
- **THEN** the result shows the corresponding shared validation icon as a compact trailing validation indicator

#### Scenario: Spec search result shows no pass icon
- **WHEN** the Search panel displays a `spec` result whose latest validation target status is `passed`
- **THEN** the result shows no inline validation icon

#### Scenario: Hide archived search validation icon
- **WHEN** the Search panel displays a `change` result whose name belongs to an archived change
- **THEN** the result uses the shared archived-change indicator semantics
- **AND** it does not show a trailing validation icon

#### Scenario: Hide non-target search validation icon
- **WHEN** the Search panel displays a `project`, `unknown`, or other non-change, non-spec result
- **THEN** the result uses the corresponding shared entity semantics
- **AND** it does not show a trailing validation icon

### Requirement: Search query can drive optional in-page viewer highlighting
With the Search panel's viewer-highlight toggle enabled and a valid query, the system SHALL use the query as the in-page highlight term for markdown viewers in the Main Viewer. The system SHALL treat the query as one literal string, SHALL highlight exact matches case-insensitively, keeping the document text, and SHALL remove highlights when the query gets too short or the toggle is off. Metadata-only matches SHALL still appear in the Search panel but SHALL NOT create in-page highlights.

#### Scenario: Open a result whose markdown body contains the query
- **WHEN** the operator opens a search result whose rendered markdown body contains the current valid query and viewer highlighting is enabled
- **THEN** the Main Viewer highlights each exact occurrence of that query in the markdown body, matched case-insensitively as one literal string
- **AND** the original document text is preserved

#### Scenario: Metadata-only match does not create viewer highlight
- **WHEN** a search result appears because the query matched a filename, path, or other metadata but the opened markdown body does not contain that query
- **THEN** the Search panel still shows the result
- **AND** the opened viewer renders without in-page highlights

#### Scenario: Disable highlighting while a highlighted document is open
- **WHEN** the operator disables the Search panel's viewer-highlight toggle while viewing a highlighted markdown document
- **THEN** the in-page highlights are removed without clearing the current search query or result list

#### Scenario: Short query removes viewer highlight
- **WHEN** viewer highlighting is enabled and the query becomes shorter than the Search minimum length
- **THEN** the in-page highlights are removed or suppressed
