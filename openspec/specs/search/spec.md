# search Specification

## Purpose
Provide workspace search through the Activity Bar so operators can open matching content in the tabbed Main Viewer.
## Requirements
### Requirement: Provide debounced workspace search from Activity Bar
The system SHALL expose a search interface accessible from the Activity Bar's Search icon. The search SHALL wait briefly before issuing a search request and SHALL suppress result queries until the operator has entered at least two characters. When the query becomes shorter than two characters, the system SHALL clear any previously displayed results. The system SHALL ignore stale debounced timers and asynchronous search responses whose query no longer matches the current input. Search results SHALL be displayed in a persistent Search panel in the Explorer Pane.

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

### Requirement: Search the supported content sources only
The system SHALL search project markdown, spec markdown, and change proposal markdown, and SHALL return each hit with a result type, result name, and excerpt.

#### Scenario: Return a project match
- **WHEN** the query matches the project document
- **THEN** the system returns a `project` result with a project excerpt

#### Scenario: Return a spec match
- **WHEN** the query matches a capability specification document
- **THEN** the system returns a `spec` result whose display name is the capability name

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
The system SHALL distinguish archived change results from active change results when rendering mixed Search panel output. A change search result whose name corresponds to an archived change SHALL use archived-change visual semantics; a change search result whose name corresponds to an active change SHALL use active-change visual semantics. Search result selection and tab-opening behavior SHALL remain unchanged.

#### Scenario: Render active change search result
- **WHEN** the Search panel displays a `change` result whose name belongs to an active change
- **THEN** the result uses the shared active-change indicator semantics
- **AND** selecting the result opens or focuses the change detail tab as before

#### Scenario: Render archived change search result
- **WHEN** the Search panel displays a `change` result whose name belongs to an archived change
- **THEN** the result uses the shared archived-change indicator semantics
- **AND** the result is visually distinguishable from active change results before selection
- **AND** selecting the result opens or focuses the change detail tab as before

#### Scenario: Preserve non-change result semantics
- **WHEN** the Search panel displays a spec, project, or unknown result
- **THEN** the result uses the corresponding shared entity visual semantics
- **AND** search query, result preservation, context menu, and clear behavior remain unchanged

