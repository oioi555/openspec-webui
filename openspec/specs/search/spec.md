# search Specification

## Purpose
Provide workspace search through the Activity Bar so operators can open matching content in the tabbed Main Viewer.
## Requirements
### Requirement: Provide debounced workspace search from Activity Bar
The system SHALL expose a search interface accessible from the Activity Bar's Search icon. The search SHALL wait briefly before issuing a search request and SHALL suppress result queries until the operator has entered at least two characters. When the query becomes shorter than two characters, the system SHALL clear any previously displayed results. The system SHALL ignore stale debounced timers and asynchronous search responses whose query no longer matches the current input. Search results SHALL be displayed in a dropdown panel or command palette overlay.

#### Scenario: Open search from Activity Bar
- **WHEN** the operator clicks the Search icon in the Activity Bar
- **THEN** a search input panel or command palette overlay appears
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
- **AND** shows the returned results in the search panel

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
Selecting a search result SHALL open a tab in the Main Viewer for the matching spec, change, or dashboard view and SHALL clear the current search results and query state.

#### Scenario: Open a spec result
- **WHEN** the operator selects a search result of type `spec`
- **THEN** a tab opens for that capability's spec detail view
- **AND** the search panel closes

#### Scenario: Open a change result
- **WHEN** the operator selects a search result of type `change`
- **THEN** a tab opens for that change's detail view
- **AND** the search panel closes
