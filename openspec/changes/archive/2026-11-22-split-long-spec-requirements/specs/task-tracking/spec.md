## MODIFIED Requirements

### Requirement: Parse markdown checkbox tasks
The system SHALL parse checklist items matching OpenSpec's v1.13.1 task-line rule: a CommonMark list marker, a checkbox holding at most one non-whitespace token, and optional description text. Only a trimmed marker of `x` or `X` SHALL count as completed. A line whose closing checkbox bracket is directly followed by `(` or `[` SHALL be ignored unless the checkbox is whitespace-only. It SHALL nest tasks by indentation, keep each task's source line number, and ignore non-checkbox content.

#### Scenario: Parse nested tasks from indentation
- **WHEN** a task list contains indented child checklist items
- **THEN** the system nests the child items under the nearest less-indented parent task
- **AND** each parsed task retains its source line number

#### Scenario: Ignore non-task lines
- **WHEN** the tasks document contains headings, paragraphs, or list items that are not checklist entries
- **THEN** the system excludes them from the parsed task tree

#### Scenario: Count plus, asterisk, and ordered-list tasks
- **WHEN** a tasks document contains checklist items marked with `+`, `*`, `1.`, or `1)`
- **THEN** the system includes each matching line in the parsed task tree
- **AND** counts them toward progress totals

#### Scenario: Accept CommonMark list markers
- **WHEN** a checklist line starts with `-`, `*`, `+`, or an ordered marker of up to nine digits followed by `.` or `)`
- **THEN** the system accepts the list marker as part of a task line

#### Scenario: Treat unknown checkbox markers as incomplete
- **WHEN** a checklist item uses a one-token marker other than `x` or `X`, such as `[~]`
- **THEN** the system includes the line as an incomplete task
- **AND** does not treat the unrecognized marker as completed

#### Scenario: Reject Markdown link bullets
- **WHEN** a list item is a Markdown link or reference whose closing checkbox bracket is immediately followed by `(` or `[`, such as `- [A](https://example.com)`
- **THEN** the system excludes that line from the parsed task tree
- **AND** still counts a whitespace-only checkbox followed by `(...)` or `[...]` as an incomplete task

#### Scenario: Count empty-description and padded-checkbox tasks
- **WHEN** a checklist item has no description text, an empty `[]` marker, or inner padding such as `[ x]`
- **THEN** the system includes the line in the parsed task tree
- **AND** treats only a marker whose trimmed value is `x` or `X` as completed
- **AND** empty `[]` and whitespace-only `[ ]` markers count as incomplete, while padded forms such as `[ x]` count as completed
