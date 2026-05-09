## MODIFIED Requirements

### Requirement: Explorer Pane renders a persistent Search panel
The system SHALL render Search as a dedicated Explorer Pane panel separate from the Active Changes, Archive, and Specs section group. When Search is active, the Explorer Pane SHALL show only the Search panel above the existing project selector footer. The panel SHALL follow the existing Explorer visual language while using a larger fixed header, localized explanatory description, search input, and persistent result list. The panel SHALL show result counts, loading state, short-query guidance, empty results, and a clear control as appropriate. Search result rows SHALL render as Explorer-style selectable list items using shared entity visual semantics, including distinct active-change and archived-change treatment when change results can be resolved to either state.

#### Scenario: Search panel initial state
- **WHEN** the Explorer Pane is switched to Search and no search query has been entered
- **THEN** the Search panel displays a prominent Search header
- **AND** it displays localized explanatory text describing the search scope
- **AND** it displays a search input
- **AND** it displays guidance that at least two characters are required

#### Scenario: Search panel result list
- **WHEN** a valid search query returns matches
- **THEN** the Search panel displays the number of matches
- **AND** it renders each result as a selectable Explorer-style list item with shared type semantics, name, and excerpt
- **AND** archived change results are visually distinguishable from active change results

#### Scenario: Search result selection preserves panel
- **WHEN** the operator selects a result in the Search panel
- **THEN** the corresponding document opens or focuses in the Main Viewer
- **AND** the Search panel remains visible with the same results so the operator can continue selecting other matches

#### Scenario: Search header remains visible while results scroll
- **WHEN** the operator scrolls a long Search result list
- **THEN** the Search header, description, current query, status, and clear control remain visible at the top of the Search panel
- **AND** only the result list scrolls

#### Scenario: Search panel clear control
- **WHEN** the Search panel has a query or visible results
- **THEN** the panel provides a clear control
- **AND** activating the clear control clears the query and visible results without closing the Explorer Pane

### Requirement: Explorer Pane renders a persistent Validation panel
The system SHALL render Validation as a dedicated Explorer Pane panel separate from the Active Changes, Archive, and Specs section group. When Validation is active, the Explorer Pane SHALL show only the Validation panel above the existing project selector footer. The panel SHALL follow the existing Explorer visual language while using a prominent header, explanatory description, Run Validate action, summary counts, validation status, and persistent failed-item list. Validation failed-item rows SHALL render as Explorer-style selectable list items using shared entity type semantics for the failed item and shared validation severity semantics for the primary issue.

#### Scenario: Validation panel initial state
- **WHEN** the Explorer Pane is switched to Validation and no validation result exists
- **THEN** the Validation panel displays a prominent Validation header
- **AND** it displays explanatory text describing that validation checks the active project's specs and changes
- **AND** it displays a Run Validate action

#### Scenario: Validation panel loading state
- **WHEN** validation is running
- **THEN** the Validation panel displays a loading state
- **AND** the Run Validate action is disabled or indicates that a run is in progress

#### Scenario: Validation panel result list
- **WHEN** validation returns failed items
- **THEN** the Validation panel displays the number of failed items
- **AND** it renders each failed item as a selectable Explorer-style list item whose first line shows a shared entity icon box and the item name
- **AND** the next line shows the failed target status and issue count

#### Scenario: Validation result selection preserves panel
- **WHEN** the operator selects a failed validation item in the Validation panel
- **THEN** the corresponding document opens or focuses in the Main Viewer when the item is navigable
- **AND** the Validation panel remains visible with the same results so the operator can continue selecting other failures

#### Scenario: Validation panel pass state
- **WHEN** validation returns no failed items
- **THEN** the Validation panel displays a passing status using shared validation status semantics
- **AND** it does not render an obsolete failed-item list
