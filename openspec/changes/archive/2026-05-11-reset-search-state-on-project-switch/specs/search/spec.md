## MODIFIED Requirements

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
