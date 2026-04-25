# search Delta Specification

## MODIFIED Requirements

### Requirement: Search the supported content sources only
The system SHALL search project markdown, spec markdown, and change proposal markdown, and SHALL return each hit with a result type, result name, and excerpt.

#### Scenario: Return a project match
- **WHEN** the query matches the project document
- **THEN** the system returns a `project` result with a project excerpt

#### Scenario: Return a spec match
- **WHEN** the query matches a capability specification document
- **THEN** the system returns a `spec` result whose display name is the capability name

### Requirement: Provide debounced workspace search from Activity Bar
The system SHALL expose a search interface accessible from the Activity Bar's Search icon. The search SHALL wait briefly before issuing a search request and SHALL suppress result queries until the operator has entered at least two characters. When the query becomes shorter than two characters, the system SHALL clear any previously displayed results. Search results SHALL be displayed in a dropdown panel or command palette overlay.

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
