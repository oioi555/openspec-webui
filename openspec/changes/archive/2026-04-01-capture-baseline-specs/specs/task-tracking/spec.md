## ADDED Requirements

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

### Requirement: Expose the next apply command for active work
For non-archived changes that still have incomplete tasks and are not in suggestion mode, the UI SHALL show a floating control that copies `/openspec:apply <change> task <label>`, where `<label>` is the leading numeric label from the first incomplete task when available and otherwise falls back to `done + 1`.

#### Scenario: Copy the next numbered task command
- **WHEN** the first incomplete task begins with a numeric label such as `2.1`
- **THEN** the floating control copies an apply command that includes the leading task number

#### Scenario: Fall back when the next task has no numeric prefix
- **WHEN** the first incomplete task does not begin with a number
- **THEN** the floating control uses the completed-task count plus one as the task label

#### Scenario: Hide the apply command when it should not be offered
- **WHEN** the change is archived, fully complete, or currently in suggestion mode
- **THEN** the floating apply-command control is not shown
