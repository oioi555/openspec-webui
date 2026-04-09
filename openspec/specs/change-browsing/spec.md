# change-browsing Specification

## Purpose
Expose active and archived changes through the Explorer Pane so operators can move from current work to historical reference within the three-pane layout.

## Requirements
### Requirement: List active and archived changes
The system SHALL list active changes in the Explorer Pane's ACTIVE CHANGES collapsible section, sorted alphabetically. The system SHALL list archived changes in the Explorer Pane's ARCHIVE collapsible section, sorted newest-first by archive date. The ACTIVE CHANGES section SHALL be rendered before the ARCHIVE section so the workflow reads from active work to historical reference. Each entry SHALL display the change name and task progress. The Activity Bar SHALL align with these sections as `Home -> ACTIVE CHANGES` and `Archive -> ARCHIVE`.

#### Scenario: Show active change summaries in Explorer
- **WHEN** the workspace contains active changes
- **THEN** the Explorer Pane's ACTIVE CHANGES section lists them alphabetically
- **AND** each entry shows the change name and task progress badge

#### Scenario: Show archived change summaries in Explorer
- **WHEN** the workspace contains archived changes
- **THEN** the Explorer Pane's ARCHIVE section lists them newest-first
- **AND** each entry shows the change name

#### Scenario: Home focuses active changes
- **WHEN** the operator opens Home from the Activity Bar
- **THEN** the Explorer Pane expands the ACTIVE CHANGES section
- **AND** the ARCHIVE section is collapsed

#### Scenario: Archive focuses archive
- **WHEN** the operator opens Archive from the Activity Bar
- **THEN** the Explorer Pane expands the ARCHIVE section
- **AND** the ACTIVE CHANGES section is collapsed

#### Scenario: Empty section in Explorer
- **WHEN** the workspace contains no active or archived changes
- **THEN** the corresponding Explorer section shows a placeholder message
