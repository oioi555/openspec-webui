# search Specification

## Purpose
Provide workspace search through the Activity Bar so operators can open matching content in the tabbed Main Viewer.
## Requirements
### Requirement: Provide debounced workspace search from Activity Bar
The system SHALL expose a search interface accessible from the Activity Bar's Search icon. The search SHALL wait briefly before issuing a search request and SHALL suppress result queries until the operator has entered at least two characters. When the query becomes shorter than two characters, the system SHALL clear any previously displayed results. When the active project changes or is cleared, the system SHALL clear the visible search query and displayed results immediately. The system SHALL ignore stale debounced timers and asynchronous search responses whose query no longer matches the current input or whose work began under a previous active project. Search results SHALL be displayed in a persistent Search panel in the Explorer Pane.

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

#### Scenario: Ignore stale search work after a project switch
- **WHEN** a Search timer or request created under project A is still pending when the operator switches to project B
- **THEN** any timer or async response associated with project A is ignored
- **AND** the Search panel in project B remains empty until the operator enters a new valid query

### Requirement: Search the supported content sources only
The system SHALL search project markdown, spec markdown, and change proposal markdown, and SHALL also match each supported search source's document name and path/file identifier. The system SHALL return each hit with a result type, result name, and excerpt. When a query matches source metadata without matching markdown body content, the system SHALL still return that document once and SHALL provide result preview data that explains the metadata match.

#### Scenario: Return a spec match from the spec name
- **WHEN** the query matches a capability spec name even if the query does not appear in that spec's markdown body
- **THEN** the system returns a single `spec` result for that capability
- **AND** the result preview explains the metadata match instead of showing an unrelated body excerpt

#### Scenario: Return a change match from source metadata
- **WHEN** the query matches a change's source name or path even if the query does not appear in the proposal body
- **THEN** the system returns a single `change` result for that change
- **AND** selecting the result still opens the same change detail tab as before

#### Scenario: Deduplicate combined content and metadata matches
- **WHEN** a query matches both a supported document's metadata and its markdown body
- **THEN** the system returns that document only once in the Search result list
- **AND** existing result navigation behavior remains unchanged

### Requirement: Navigate directly from search results
Selecting a search result SHALL open a tab in the Main Viewer for the matching spec, change, or dashboard view while preserving the current search query and visible results in the Explorer Pane Search panel.

#### Scenario: Open a spec result
- **WHEN** the operator selects a search result of type `spec`
- **THEN** a tab opens for that capability's spec detail view
- **AND** the Search panel remains visible with the current query and results

#### Scenario: Open a change result
- **WHEN** the operator selects a search result of type `change`
- **THEN** a tab opens for that change's detail view
- **AND** the Search panel remains visible with the current query and results

### Requirement: Search requests from contextual entry points use Explorer search
The system SHALL route search requests initiated from context menu actions and `Spec.md` keyword search affordances into the Explorer Pane Search panel using the same query, debounce, result display, and result selection behavior as Activity Bar search.

#### Scenario: Context menu search populates Explorer search
- **WHEN** the operator chooses a context menu action that searches for an item-related keyword
- **THEN** the Explorer Pane opens if collapsed
- **AND** the Explorer Pane switches to the Search panel
- **AND** the search input contains the requested keyword
- **AND** matching results appear in the Search panel

#### Scenario: Spec keyword search populates Explorer search
- **WHEN** the operator invokes keyword search from `Spec.md` content
- **THEN** the Explorer Pane opens if collapsed
- **AND** the Explorer Pane switches to the Search panel
- **AND** the search input contains the requested keyword
- **AND** matching results appear in the Search panel

### Requirement: Search results distinguish archived changes
The system SHALL distinguish archived change results from active change results when rendering mixed Search panel output. A change search result whose name corresponds to an archived change SHALL use archived-change visual semantics; a change search result whose name corresponds to an active change SHALL use active-change visual semantics. Search result rows SHALL also mirror the inline validation-icon rules of the resolved target kind: active change results show `failed`, `warning`, `info`, or `passed`; archived change results show no inline validation icon; spec results show only `failed`, `warning`, or `info`; other result kinds show no inline validation icon. Search result selection and tab-opening behavior SHALL remain unchanged.

#### Scenario: Render active change search result with pass icon
- **WHEN** the Search panel displays a `change` result whose name belongs to an active change and that change's latest validation target status is `passed`
- **THEN** the result uses the shared active-change indicator semantics
- **AND** it also shows the shared pass icon as a compact trailing validation indicator

#### Scenario: Render spec search result with attention icon
- **WHEN** the Search panel displays a `spec` result whose latest validation target status is `failed`, `warning`, or `info`
- **THEN** the result shows the corresponding shared validation icon as a compact trailing validation indicator

#### Scenario: Hide archived search validation icon
- **WHEN** the Search panel displays a `change` result whose name belongs to an archived change
- **THEN** the result uses the shared archived-change indicator semantics
- **AND** it does not show a trailing validation icon

#### Scenario: Hide non-target search validation icon
- **WHEN** the Search panel displays a `project` or `unknown` result
- **THEN** the result uses the corresponding shared entity semantics
- **AND** it does not show a trailing validation icon

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

