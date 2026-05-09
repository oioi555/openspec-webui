## ADDED Requirements

### Requirement: Inline validation status uses shared semantics
The system SHALL render inline validation target status using the shared entity, validation status, and validation severity semantics. The inline status surface SHALL avoid duplicating local status icon, status badge variant, and issue severity variant mappings when shared semantics are available. It SHALL keep the existing accessible status and details labels, collapsible details behavior, last-run metadata, and issue detail content.

#### Scenario: Render inline validation summary without badge clutter
- **WHEN** an inline validation status is shown for a spec or change
- **THEN** it renders the validation state using shared semantic indicators
- **AND** it does not repeat the target type when the surrounding viewer title already identifies the item type
- **AND** issue counts remain visible when issues exist
- **AND** the row does not rely on separate ad-hoc type, status, and issue badges for every classification

#### Scenario: Render inline validation issue details
- **WHEN** the inline validation status expands to show validation issues
- **THEN** each issue uses shared severity semantics for its level
- **AND** the issue path and message remain visible as before

## MODIFIED Requirements

### Requirement: Render Validation panel in the Explorer Pane
The system SHALL provide a dedicated Validation panel in the Explorer Pane. The panel SHALL display a compact header aligned with the shared Explorer panel visual language, Run Validate action, last-run metadata, loading and error states, validation result summary, and a list of failed validation items. The panel SHALL keep persistent validation preferences out of the Explorer header, SHALL avoid duplicating summary counts between the header and result list, SHALL place last-run metadata on its own line so the run button loading spinner does not cause horizontal layout shift, and SHALL remain visible after a validation item opens a Main Viewer tab. Failed validation items SHALL use shared entity type and validation severity semantics instead of maintaining local type/severity badge mappings.

#### Scenario: Open Validation panel from Activity Bar
- **WHEN** the operator clicks the Validate icon in the Activity Bar
- **THEN** the Explorer Pane opens if collapsed
- **AND** the Explorer Pane switches to the Validation panel

#### Scenario: Initial Validation panel state
- **WHEN** the Validation panel is opened before any validation run has completed
- **THEN** the panel shows a Run Validate action
- **AND** it explains that validation checks the active project's specs and changes without duplicating result summary counts

#### Scenario: Last-run metadata remains stable during loading
- **WHEN** the operator starts validation and the Run button adds a loading spinner
- **THEN** the last-run metadata remains on a separate line from the button
- **AND** the metadata does not shift horizontally because the button width changed

#### Scenario: Display failed validation items
- **WHEN** the latest validation result has failed items
- **THEN** the Validation panel lists each failed item with a first line containing shared entity icon box and item name
- **AND** each failed item shows the same failed target status wording used by inline validation status plus the issue count on the next line
- **AND** issue severity labels such as Error or Warning are not used as the failed file row's target status
- **AND** the panel shows the total failed item count in the result list area
- **AND** the failed item rows remain selectable when the item is navigable

#### Scenario: Display passing validation state
- **WHEN** the latest validation result passed
- **THEN** the Validation panel shows a passing status using shared validation status semantics
- **AND** it does not show stale failed items from an earlier run
