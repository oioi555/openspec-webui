# dashboard-task-summary Specification

## Requirements

### Requirement: Dashboard displays a task summary card
The system SHALL display a Tasks summary card in the Dashboard's top summary card area. The card SHALL show the overall task completion percentage and the corresponding `done/total` aggregate counts derived from the dashboard task progress summary.

#### Scenario: Dashboard shows zero-task summary
- **WHEN** the Dashboard renders and the overall task progress has `0` completed tasks and `0` total tasks
- **THEN** the Tasks card shows `0%`
- **AND** it shows `0/0` task counts

#### Scenario: Dashboard shows complete task summary
- **WHEN** the Dashboard renders and the overall task progress has `done = total` with `total > 0`
- **THEN** the Tasks card shows the computed completion percentage and aggregate counts for the complete state

### Requirement: Dashboard task card icon reflects task progress state
The Dashboard Tasks summary card SHALL derive its icon tone from the overall task progress summary rather than using a fixed tone. The icon SHALL use a subdued neutral tone when no tasks exist, a warning tone when tasks remain incomplete, and a success tone when all tasks are complete.

#### Scenario: Dashboard task card icon is subdued when no tasks exist
- **WHEN** the Dashboard renders the Tasks card with `total = 0`
- **THEN** the task icon uses the shared subdued neutral task-progress tone
- **AND** it does not use warning or success styling

#### Scenario: Dashboard task card icon shows warning for incomplete work
- **WHEN** the Dashboard renders the Tasks card with `total > 0` and `done < total`
- **THEN** the task icon uses the shared warning task-progress tone

#### Scenario: Dashboard task card icon shows success for complete work
- **WHEN** the Dashboard renders the Tasks card with `total > 0` and `done = total`
- **THEN** the task icon uses the shared success task-progress tone

### Requirement: Dashboard task card preserves existing content and interaction
The Dashboard Tasks summary card SHALL keep its existing percentage label, `done/total` text, progress bar, and click behavior while adopting state-aware icon tone.

#### Scenario: Task card keeps existing behavior while icon tone changes
- **WHEN** the Dashboard Tasks card renders with any supported task-progress state
- **THEN** its percentage text, count text, progress bar, layout, and click target remain unchanged
- **AND** only the icon tone changes according to task progress state
