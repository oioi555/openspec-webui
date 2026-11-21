## MODIFIED Requirements

### Requirement: Execute project validation from the WebUI
The system SHALL expose a project-scoped validation action that runs OpenSpec validation for the active workspace with semantics equivalent to `openspec validate --all [--strict] [--concurrency <n>] --json`, strict by default. It SHALL return a normalized result: overall status, pass/fail counts, per-item issue summaries, issue-bearing items, item-level status counts, last-run timestamp, and raw command failure context when execution fails outside normal validation failure semantics.

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
The system SHALL provide a dedicated Validation panel in the Explorer Pane with a compact header, Run Validate action, last-run metadata, loading and error states, result summary, and a list of attention items shown by file-level status, not issue severity. The panel SHALL keep persistent validation preferences out of the Explorer header, SHALL NOT duplicate header and list counts, SHALL put last-run metadata on its own line, and SHALL stay visible after an item opens a Main Viewer tab.

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

#### Scenario: Explorer header holds no persistent preferences
- **WHEN** the Validation panel header is rendered
- **THEN** persistent validation preferences are not shown in the Explorer header
- **AND** summary counts are not duplicated between the header and the result list

#### Scenario: Panel stays visible after opening an item
- **WHEN** the operator opens a validation item in a Main Viewer tab
- **THEN** the Validation panel remains visible in the Explorer Pane

### Requirement: Validation distinguishes file status from issue severity
The system SHALL distinguish file-level validation status, which describes a validation target such as a spec, change, project, or unknown item, from issue-level severity, which describes an individual issue, and SHALL NOT use issue severity labels as a target's file-level status label. When issues exist, the derived file-level status SHALL follow the highest issue severity present before falling back to the raw validity flag.

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
The validation result SHALL expose `failedItems`, holding items whose derived status is `failed`, separately from `issueItems` or an equivalent field holding every item with one or more issues, including items with `WARNING` or `INFO` issues even when the raw validity flag is `false`. Summary counts SHALL let the client render failed, warning, and info item counts without reinterpreting issue severities in each UI surface.

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
