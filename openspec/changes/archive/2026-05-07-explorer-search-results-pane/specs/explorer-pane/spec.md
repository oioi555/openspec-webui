## ADDED Requirements

### Requirement: Explorer Pane renders a persistent Search panel
The system SHALL render Search as a dedicated Explorer Pane panel separate from the Active Changes, Archive, and Specs section group. When Search is active, the Explorer Pane SHALL show only the Search panel above the existing project selector footer. The panel SHALL follow the existing Explorer visual language while using a larger fixed header, localized explanatory description, search input, and persistent result list. The panel SHALL show result counts, loading state, short-query guidance, empty results, and a clear control as appropriate.

#### Scenario: Search panel initial state
- **WHEN** the Explorer Pane is switched to Search and no search query has been entered
- **THEN** the Search panel displays a prominent Search header
- **AND** it displays localized explanatory text describing the search scope
- **AND** it displays a search input
- **AND** it displays guidance that at least two characters are required

#### Scenario: Search panel result list
- **WHEN** a valid search query returns matches
- **THEN** the Search panel displays the number of matches
- **AND** it renders each result as a selectable Explorer-style list item with type, name, and excerpt

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
