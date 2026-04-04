# search Specification

## Purpose
TBD - created by archiving change capture-baseline-specs. Update Purpose after archive.
## Requirements
### Requirement: Provide debounced workspace search from navigation
The system SHALL expose a search input in the primary navigation, SHALL wait briefly before issuing a search request, and SHALL suppress result queries until the operator has entered at least two characters.

#### Scenario: Ignore a short query
- **WHEN** the operator enters fewer than two characters
- **THEN** the system clears the visible search results
- **AND** does not issue a search request

#### Scenario: Debounce a valid query
- **WHEN** the operator enters a query with at least two characters
- **THEN** the system waits for the debounce interval before issuing the search request
- **AND** shows the returned results in a dropdown list

### Requirement: Search the supported content sources only
The system SHALL search project markdown, spec markdown, spec design markdown, and change proposal markdown, and SHALL return each hit with a result type, result name, source path, excerpt, and first-match line number.

#### Scenario: Return a project match
- **WHEN** the query matches the project document
- **THEN** the system returns a `project` result with a project excerpt and line number

#### Scenario: Return a spec design match
- **WHEN** the query matches a capability design document
- **THEN** the system returns a `spec` result whose display name includes `(design)`

#### Scenario: Exclude unsupported content sources
- **WHEN** the query only appears in change tasks, change design files, or supplemental change artifacts
- **THEN** the system does not return those matches

### Requirement: Navigate directly from search results
Selecting a search result SHALL navigate to the matching dashboard, spec detail, or change detail view and SHALL clear the current search results and query state.

#### Scenario: Open a spec result
- **WHEN** the operator selects a search result of type `spec`
- **THEN** the system navigates to that capability's spec detail view
- **AND** clears the active search UI state

#### Scenario: Open a change result
- **WHEN** the operator selects a search result of type `change`
- **THEN** the system navigates to that change detail view
- **AND** clears the active search UI state

