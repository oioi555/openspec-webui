## ADDED Requirements

### Requirement: Watcher errors are not fatal
When a project's file watcher reports an error, the system SHALL log a warning that identifies the watched OpenSpec directory and SHALL keep the server and other project sessions running.

#### Scenario: Watcher reports an error
- **WHEN** the watcher for an active project emits an error
- **THEN** a warning naming the watched directory is logged
- **AND** the server process does not exit
