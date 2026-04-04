# task-tracking Specification

## Purpose
TBD - created by archiving change capture-baseline-specs. Update Purpose after archive.
## Requirements
### Requirement: Parse markdown checkbox tasks
The system SHALL parse markdown checklist items written as `- [ ]` or `- [x]`, SHALL build nested task trees from indentation, SHALL retain the source line number for each parsed task, and SHALL ignore non-checkbox content.

#### Scenario: Parse nested tasks from indentation
- **WHEN** a task list contains indented child checklist items
- **THEN** the system nests the child items under the nearest less-indented parent task

#### Scenario: Ignore non-task lines
- **WHEN** the tasks document contains headings, paragraphs, or list items that are not checklist entries
- **THEN** the system excludes them from the parsed task tree

### Requirement: Calculate recursive task progress
The system SHALL calculate per-change progress by counting all parsed tasks recursively, SHALL compute done, total, and rounded percentage values, and SHALL use active change task progress to compute the dashboard's overall progress.

#### Scenario: Count completed nested tasks
- **WHEN** a change contains completed and incomplete tasks across multiple nesting levels
- **THEN** the system counts every task in the tree toward the total
- **AND** counts every checked task toward the completed count

#### Scenario: Report zero progress when no tasks exist
- **WHEN** a change has no checklist tasks
- **THEN** the system reports `0` completed tasks, `0` total tasks, and `0%` progress



