## ADDED Requirements

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
