## MODIFIED Requirements

### Requirement: Explorer Pane renders a persistent Validation panel
The system SHALL render Validation as a dedicated Explorer Pane panel separate from the Active Changes, Archive, and Specs section group. When Validation is active, the Explorer Pane SHALL show only the Validation panel above the existing project selector footer. The panel SHALL follow the existing Explorer visual language while using a compact header, initial list placeholder with prominent Run Validate action, compact post-run reload action, last-run metadata, loading and error states, result-visible compact file-status count filters, validation status, and persistent validation item list. The title row SHALL show the Validation title and a compact action that opens Settings to the Validation section. The title row SHALL NOT show the validation result status badge. Before a result exists, explanatory content and the prominent Run Validate action SHALL live in the list placeholder. After a result exists, the compact reload action SHALL appear in the title-row action cluster beside the Settings action, and file-status count filters SHALL appear in a compact status row below. The panel SHALL keep persistent validation preferences out of the Explorer header, SHALL avoid duplicating summary counts between the header and result list, SHALL place last-run metadata on its own line so the run button loading spinner does not cause horizontal layout shift, and SHALL remain visible after a validation item opens a Main Viewer tab.

#### Scenario: Validation panel initial state
- **WHEN** the Explorer Pane is switched to Validation and no validation result exists
- **THEN** the Validation panel displays a compact Validation header
- **AND** the title row includes a small settings action
- **AND** the title row does not include the post-run reload action before validation has run
- **AND** the title row does not display a validation status badge
- **AND** the list area displays an explanatory placeholder
- **AND** the placeholder displays a prominent text-labeled Run Validate action
- **AND** the header does not display file-status count filters before a result exists

#### Scenario: Settings action opens validation settings
- **WHEN** the operator activates the settings action in the Validation panel title row
- **THEN** the Settings tab opens or focuses in the Main Viewer
- **AND** the Validation settings section is selected or scrolled into view
- **AND** the Validation Explorer panel remains available in the Explorer Pane

#### Scenario: Run Validate explains validation through native title
- **WHEN** the operator focuses or hovers the Run Validate action
- **THEN** the control provides explanatory text through the native button title describing what validation checks
- **AND** the panel does not need a persistent prose description above the action
- **AND** the initial placeholder action may be text-labeled for clarity
- **AND** the post-run header reload action is icon-only because it appears inside the dedicated Validation panel

#### Scenario: Validation panel loading state
- **WHEN** validation is running
- **THEN** the Validation panel displays a loading state
- **AND** the Run Validate action is disabled or indicates that a run is in progress
- **AND** last-run metadata does not shift horizontally because the button width changed

#### Scenario: Validation panel shows post-run reload and status count filters
- **WHEN** validation has completed and file-level status counts are available
- **THEN** the title row displays a compact reload action beside the Settings action
- **AND** the status row displays compact counts for `failed`, `warning`, and `info`
- **AND** included statuses are visually distinguishable by status tone
- **AND** excluded statuses are visually muted or greyed out
- **AND** activating a count toggles that status between included and excluded
- **AND** the list shows non-passed attention items whose file-level status is currently included

#### Scenario: Validation result list remains persistent
- **WHEN** the operator selects a validation item in the Validation panel
- **THEN** the corresponding document opens or focuses in the Main Viewer when the item is navigable
- **AND** the Validation panel remains visible with the same result state so the operator can continue selecting other validation items

#### Scenario: Validation panel pass state
- **WHEN** validation returns no items requiring attention
- **THEN** the Validation panel displays a passing status
- **AND** it does not render obsolete items from an earlier run
