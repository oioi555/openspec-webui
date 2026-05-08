## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Execute project validation from the WebUI
The system SHALL expose a project-scoped validation action that runs OpenSpec validation for the active workspace using all-item validation semantics equivalent to `openspec validate --all [--strict] [--concurrency <n>] --json`. Strict mode SHALL default to enabled for backward compatibility. The action SHALL return a normalized validation result containing overall status, pass/fail counts, per-item issue summaries, last-run timestamp, and raw command failure context when command execution fails outside normal validation failure semantics.

#### Scenario: Validation passes
- **WHEN** the operator runs validation for an active project whose OpenSpec content is valid
- **THEN** the system returns a validation result with overall status `passed`
- **AND** the failed item count is `0`
- **AND** the result records the validation run timestamp

#### Scenario: Validation fails with invalid OpenSpec content
- **WHEN** the operator runs validation for an active project whose OpenSpec content has validation errors
- **THEN** the system returns a validation result with overall status `failed`
- **AND** the result includes one or more failed validation items
- **AND** the API response is treated as validation domain data rather than a generic server error

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
The system SHALL provide a dedicated Validation panel in the Explorer Pane. The panel SHALL display a compact header, Run Validate action, last-run metadata, loading and error states, validation result summary, and a list of failed validation items. The panel SHALL keep persistent validation preferences out of the Explorer header, SHALL avoid duplicating summary counts between the header and result list, SHALL place last-run metadata on its own line so the run button loading spinner does not cause horizontal layout shift, and SHALL remain visible after a validation item opens a Main Viewer tab.

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
- **THEN** the Validation panel lists the failed items with item type, item name, severity, and issue count
- **AND** the panel shows the total failed item count in the result list area

#### Scenario: Display passing validation state
- **WHEN** the latest validation result passed
- **THEN** the Validation panel shows a passing status
- **AND** it does not show stale failed items from an earlier run
