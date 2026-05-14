## ADDED Requirements

### Requirement: Auto-run validation after precise artifact changes
The client SHALL expose a browser-local validation preference for automatically running full project validation after relevant OpenSpec artifact file changes. This preference SHALL be separate from the existing Validation-panel auto-run preference, and SHALL NOT be sent to the validation API.

#### Scenario: Persist artifact-change auto-run preference
- **WHEN** the operator enables or disables artifact-change auto-run in validation settings
- **THEN** the client persists that preference locally
- **AND** the preference is restored when the app loads again
- **AND** validation requests continue to include only strict mode and concurrency execution options

#### Scenario: Relevant active change artifact schedules validation
- **WHEN** artifact-change auto-run is enabled
- **AND** the client receives a file-change refresh caused by a markdown file add, change, or unlink event under an active change
- **THEN** the client schedules a full project validation run using the existing validation refresh behavior

#### Scenario: Relevant spec artifact schedules validation
- **WHEN** artifact-change auto-run is enabled
- **AND** the client receives a file-change refresh caused by a markdown file add, change, or unlink event under canonical specs
- **THEN** the client schedules a full project validation run using the existing validation refresh behavior

#### Scenario: Irrelevant file change does not schedule validation
- **WHEN** artifact-change auto-run is enabled
- **AND** the client receives a refresh caused only by a directory event, a non-markdown file event, an archived-change artifact event, or an unrelated project file event
- **THEN** the client does not schedule artifact-change auto-validation from that event

### Requirement: Debounce artifact-change auto-validation
The client SHALL debounce artifact-change auto-validation so bursts of relevant artifact file events produce one full validation run after relevant file changes settle.

#### Scenario: Multi-file artifact creation produces one validation run
- **WHEN** artifact-change auto-run is enabled
- **AND** multiple relevant markdown artifact file events arrive before the debounce quiet window elapses
- **THEN** the client resets the pending auto-validation timer for each event
- **AND** the client starts one full validation run after no further relevant events arrive within the quiet window

#### Scenario: Auto-validation avoids duplicate concurrent runs
- **WHEN** artifact-change auto-run is enabled
- **AND** a validation run is already loading
- **THEN** relevant artifact events do not start an additional concurrent validation run

#### Scenario: Project switch clears pending artifact auto-validation
- **WHEN** the active project changes before a pending artifact-change auto-validation run starts
- **THEN** the client clears the pending run for the previous project
- **AND** validation state remains scoped to the new active project

### Requirement: File refresh messages expose validation trigger metadata
The system SHALL include optional file-change cause metadata on WebSocket data refresh messages that are caused by watched file-system events, so the client can distinguish precise artifact changes from broader refreshes.

#### Scenario: Refresh includes file event cause
- **WHEN** the server broadcasts a data refresh because the OpenSpec watcher observed a file-system event
- **THEN** the refresh message includes the watcher event type
- **AND** the refresh message includes the changed path when available
- **AND** existing refresh entity, entity id, and data fields remain available

#### Scenario: Client tolerates refresh without cause
- **WHEN** the client receives a data refresh without file-change cause metadata
- **THEN** normal workspace refresh handling continues
- **AND** artifact-change auto-validation is not scheduled from missing cause metadata alone

### Requirement: Dashboard active changes show compact validation status
Dashboard active-change list items SHALL display compact validation status icons for active changes using the same validation target semantics as Explorer active-change rows.

#### Scenario: Active change row shows validation icon after result
- **WHEN** the latest validation result contains a status for an active change listed on the Dashboard
- **THEN** that active-change row displays the compact validation status icon for passed, info, warning, or failed states
- **AND** the icon semantics match the Explorer active-change row semantics

#### Scenario: Non-actionable states stay hidden in compact rows
- **WHEN** an active change has no validation result, a stale result, or an unknown validation state
- **THEN** the Dashboard active-change row does not display a compact validation icon for that state

### Requirement: Archived changes are not shown as validation targets
The UI SHALL NOT present archived changes as validation targets because archived changes are ignored by OpenSpec validation.

#### Scenario: Archived change detail hides validation status
- **WHEN** the operator opens an archived change detail page
- **THEN** the page does not render inline validation status for that archived change
- **AND** the page does not render a validation re-run control for that archived change

#### Scenario: Active change detail keeps validation status
- **WHEN** the operator opens an active change detail page
- **THEN** the page renders inline validation status for that active change

### Requirement: Viewer validation status can re-run full validation
Inline validation status surfaces for specs and active changes SHALL provide a manual re-run action that starts the existing full project validation flow.

#### Scenario: Re-run from spec detail
- **WHEN** the operator clicks the re-run validation action on a spec detail page
- **THEN** the client starts full project validation using the same behavior as the Validation panel refresh action
- **AND** the latest full validation result updates the inline spec status when the run completes

#### Scenario: Re-run from active change detail
- **WHEN** the operator clicks the re-run validation action on an active change detail page
- **THEN** the client starts full project validation using the same behavior as the Validation panel refresh action
- **AND** the latest full validation result updates the inline active-change status when the run completes

#### Scenario: Re-run action reflects loading state
- **WHEN** validation is currently loading
- **THEN** inline validation re-run actions are disabled or otherwise indicate that validation is already running
- **AND** clicking the action does not start a duplicate concurrent validation run
