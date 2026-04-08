## MODIFIED Requirements

### Requirement: Provide debounced workspace search from Activity Bar
The system SHALL expose a search interface accessible from the Activity Bar's Search icon. The search SHALL wait briefly before issuing a search request and SHALL suppress result queries until the operator has entered at least two characters. Search results SHALL be displayed in a dropdown panel or command palette overlay.

#### Scenario: Open search from Activity Bar
- **WHEN** the operator clicks the Search icon in the Activity Bar
- **THEN** a search input panel or command palette overlay appears
- **AND** the search input is focused and ready for typing

#### Scenario: Ignore a short query
- **WHEN** the operator enters fewer than two characters in the search input
- **THEN** the system clears the visible search results
- **AND** does not issue a search request

#### Scenario: Debounce a valid query
- **WHEN** the operator enters a query with at least two characters
- **THEN** the system waits for the debounce interval before issuing the search request
- **AND** shows the returned results in the search panel

### Requirement: Search the supported content sources only
The system SHALL search project markdown, spec markdown, spec design markdown, and change proposal markdown, and SHALL return each hit with a result type, result name, source path, excerpt, and first-match line number.

#### Scenario: Return a project match
- **WHEN** the query matches the project document
- **THEN** the system returns a `project` result with a project excerpt and line number

#### Scenario: Return a spec design match
- **WHEN** the query matches a capability design document
- **THEN** the system returns a `spec` result whose display name includes `(design)`

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
