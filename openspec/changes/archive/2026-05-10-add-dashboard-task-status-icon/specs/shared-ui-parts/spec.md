## ADDED Requirements

### Requirement: Shared task progress icon semantics
The system SHALL provide shared task-progress icon semantics for summary surfaces that represent aggregate task completion. The shared semantics SHALL define the canonical `IconBox` tone for zero-task, incomplete-task, and complete-task states so task summary icons do not rely on local hardcoded variants.

#### Scenario: Render zero-task summary icon
- **WHEN** a task summary surface renders aggregate progress with `total = 0`
- **THEN** the shared task-progress icon semantics return a muted or subdued neutral `IconBox` tone

#### Scenario: Render incomplete-task summary icon
- **WHEN** a task summary surface renders aggregate progress with `total > 0` and `done < total`
- **THEN** the shared task-progress icon semantics return a warning `IconBox` tone

#### Scenario: Render complete-task summary icon
- **WHEN** a task summary surface renders aggregate progress with `total > 0` and `done = total`
- **THEN** the shared task-progress icon semantics return a success `IconBox` tone
