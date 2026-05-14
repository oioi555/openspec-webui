## Purpose

Validation provides project-scoped OpenSpec validation from the WebUI, with configurable execution preferences, result display, and integration into the Explorer Pane.
## Requirements
### Requirement: Persist validation execution preferences
The client SHALL persist validation execution preferences for strict mode, optional concurrency, and automatic validation runs using the existing browser-local preferences pattern. Automatic validation SHALL remain a client-only preference and SHALL NOT be sent to the validation API.

#### Scenario: Validation preferences survive reload
- **WHEN** the operator changes validation strict mode, concurrency, or auto-run settings
- **THEN** the client persists those settings locally
- **AND** the settings are restored when the app loads again

#### Scenario: Auto-run is not sent to the server
- **WHEN** the client starts a validation request using stored validation preferences
- **THEN** the request body includes strict mode and concurrency options
- **AND** the request body does not include the auto-run preference

#### Scenario: Auto-run starts validation from a clean panel state
- **WHEN** auto-run is enabled and the Validation panel opens for an active project with no current result or error
- **THEN** validation starts automatically
- **AND** repeated reactive renders do not start duplicate validation runs

#### Scenario: Auto-run runs after project switch
- **WHEN** auto-run is enabled and the active project changes
- **THEN** validation state resets for the new project
- **AND** the Validation panel can automatically run validation for the new project

### Requirement: Execute project validation from the WebUI
The system SHALL expose a project-scoped validation action that runs OpenSpec validation for the active workspace using all-item validation semantics equivalent to `openspec validate --all [--strict] [--concurrency <n>] --json`. Strict mode SHALL default to enabled for backward compatibility. The action SHALL return a normalized validation result containing overall status, pass/fail counts, per-item issue summaries, issue-bearing items, item-level status counts, last-run timestamp, and raw command failure context when command execution fails outside normal validation failure semantics.

#### Scenario: Validation passes
- **WHEN** the operator runs validation for an active project whose OpenSpec content is valid and contains no issues
- **THEN** the system returns a validation result with overall status `passed`
- **AND** the failed item count is `0`
- **AND** the issue item count is `0`
- **AND** the result records the validation run timestamp

#### Scenario: Validation fails with invalid OpenSpec content
- **WHEN** the operator runs validation for an active project whose OpenSpec content has validation errors
- **THEN** the system returns a validation result with overall status `failed`
- **AND** the result includes one or more failed validation items
- **AND** the API response is treated as validation domain data rather than a generic server error

#### Scenario: Validation returns warning issues without failing
- **WHEN** the operator runs validation and the active project has no `ERROR` issues and has one or more `WARNING` issues
- **THEN** the system returns a validation result with overall status `passed`
- **AND** the failed item count is `0`
- **AND** the issue item count is greater than `0`
- **AND** at least one item-level status count is recorded as `warning`

#### Scenario: Validation returns informational issues without failing
- **WHEN** the operator runs validation and the active project has only valid items with `INFO` issues
- **THEN** the system returns a validation result with overall status `passed`
- **AND** the failed item count is `0`
- **AND** the issue item count is greater than `0`
- **AND** at least one item-level status count is recorded as `info`

#### Scenario: Validation defaults to strict mode
- **WHEN** the client runs validation without explicit execution options
- **THEN** the server executes validation with `--strict`
- **AND** existing validation callers retain strict validation behavior

#### Scenario: Validation runs without strict mode
- **WHEN** the client runs validation with strict mode disabled
- **THEN** the server omits `--strict` from the OpenSpec validation command

#### Scenario: Validation runs with concurrency
- **WHEN** the client runs validation with a positive integer concurrency value
- **THEN** the server includes `--concurrency <n>` in the OpenSpec validation command

#### Scenario: Invalid concurrency is ignored
- **WHEN** the client sends a missing, non-integer, or non-positive concurrency value
- **THEN** the server omits `--concurrency`
- **AND** validation still runs with the remaining normalized options

#### Scenario: Validation cannot execute
- **WHEN** validation cannot be executed because the project context is missing or the command cannot be launched
- **THEN** the system reports an API error using the existing structured error pattern
- **AND** the previous validation result, if any, is not replaced by an incomplete result
- **AND** command failure context records the actual validation command that was attempted

### Requirement: Render Validation panel in the Explorer Pane
The system SHALL provide a dedicated Validation panel in the Explorer Pane. The panel SHALL display a compact header, Run Validate action, last-run metadata, loading and error states, validation result summary, and a list of validation items requiring attention. The panel SHALL keep persistent validation preferences out of the Explorer header, SHALL avoid duplicating summary counts between the header and result list, SHALL place last-run metadata on its own line so the run button loading spinner does not cause horizontal layout shift, and SHALL remain visible after a validation item opens a Main Viewer tab. The list SHALL render non-passed validation items using file-level status rather than issue severity labels.

#### Scenario: Open Validation panel from Activity Bar
- **WHEN** the operator clicks the Validate icon in the Activity Bar
- **THEN** the Explorer Pane opens if collapsed
- **AND** the Explorer Pane switches to the Validation panel

#### Scenario: Initial Validation panel state
- **WHEN** the Validation panel is opened before any validation run has completed
- **THEN** the panel shows a Run Validate action
- **AND** it explains how to run validation without duplicating result summary counts

#### Scenario: Last-run metadata remains stable during loading
- **WHEN** the operator starts validation and the Run button adds a loading spinner
- **THEN** the last-run metadata remains on a separate line from the button
- **AND** the metadata does not shift horizontally because the button width changed

#### Scenario: Display attention validation items
- **WHEN** the latest validation result has failed, warning, or info items
- **THEN** the Validation panel lists those non-passed items
- **AND** each row displays the file-level status and issue count
- **AND** the row does not use `ERROR`, `WARNING`, or `INFO` issue severity as the file-level status label

#### Scenario: Display passing validation state
- **WHEN** the latest validation result has no failed, warning, or info items
- **THEN** the Validation panel shows a passing status
- **AND** it does not show stale failed or issue items from an earlier run

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

### Requirement: Validation distinguishes file status from issue severity
The system SHALL distinguish file-level validation status from issue-level severity. File-level status SHALL describe a validation target such as a spec, change, project, or unknown item. Issue-level severity SHALL describe an individual validation issue. The system SHALL NOT use issue severity labels as the file-level status label for a validation target. When issues exist, the derived file-level status SHALL follow the highest issue severity present before falling back to the raw validity flag.

#### Scenario: Failed file with error issue
- **WHEN** a validation item contains an `ERROR` issue
- **THEN** the item-level status is `failed`
- **AND** the issue detail preserves the `ERROR` severity

#### Scenario: Warning file with warning issue
- **WHEN** a validation item contains no `ERROR` issues and contains at least one `WARNING` issue
- **THEN** the item-level status is `warning`
- **AND** issue details preserve their `WARNING` severity

#### Scenario: Info file with only info issues
- **WHEN** a validation item contains no `ERROR` or `WARNING` issues and contains at least one `INFO` issue
- **THEN** the item-level status is `info`
- **AND** issue details preserve their `INFO` severity

#### Scenario: Invalid file without issues
- **WHEN** a validation item is invalid and contains no issues
- **THEN** the item-level status is `failed`

#### Scenario: Passed file without issues
- **WHEN** a validation item is valid and contains no issues
- **THEN** the item-level status is `passed`

### Requirement: Validation result exposes issue-bearing items
The validation result returned to the client SHALL expose failed items separately from issue-bearing items. `failedItems` SHALL contain items whose derived item status is `failed`. The result SHALL also expose `issueItems` or an equivalent field containing every item with one or more issues, including items with `WARNING` or `INFO` issues even when the raw validity flag is `false`. Summary counts SHALL allow the client to render failed, warning, and info item counts without reinterpreting issue severities in each UI surface.

#### Scenario: Invalid error item appears in both failed and issue lists
- **WHEN** a validation item is invalid and has at least one `ERROR` issue
- **THEN** the result includes the item in `failedItems`
- **AND** the result includes the item in `issueItems`

#### Scenario: Warning item appears only in issue list
- **WHEN** a validation item has a `WARNING` issue without an `ERROR` issue
- **THEN** the result does not include the item in `failedItems`
- **AND** the result includes the item in `issueItems`
- **AND** the item's derived status is `warning`

#### Scenario: Info item appears only in issue list
- **WHEN** a validation item has only `INFO` issues
- **THEN** the result does not include the item in `failedItems`
- **AND** the result includes the item in `issueItems`
- **AND** the item's derived status is `info`

### Requirement: Validation exposes item status counts for compact summaries
The system SHALL make file-level item status counts available to the Validation Explorer header so it can display compact `failed`, `warning`, and `info` counts after a validation run. Counts SHALL be based on item status so the header badges match the Validation list categories.

#### Scenario: Count item statuses after validation
- **WHEN** a validation result contains items with `failed`, `warning`, and `info` statuses
- **THEN** the client can display separate counts for each item status
- **AND** the counts are available without re-parsing issue messages

#### Scenario: Counts remain distinct from file status counts
- **WHEN** an item has multiple issues
- **THEN** issue severity counts count the issues by severity
- **AND** file-level status counts remain a separate concept

#### Scenario: Header filters use item status counts
- **WHEN** the Validation Explorer header displays failed, warning, and info badges
- **THEN** each badge count matches the number of list items with that file-level status
- **AND** excluding a badge hides the same item category represented by the badge count
- **AND** multiple badges can remain included or excluded at the same time

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
