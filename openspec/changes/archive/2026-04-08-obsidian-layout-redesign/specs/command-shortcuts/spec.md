## MODIFIED Requirements

### Requirement: Show workspace command buttons on Dashboard and Changes
The system SHALL render copy-command buttons inline within the ACTIVE CHANGES section header of the `Home → ACTIVE CHANGES` surface, whether that surface is shown in the persistent Explorer Pane or the temporary narrow-width Home drawer. The system SHALL always include the core workspace commands `propose` and `explore`, SHALL include `new` only when that expanded command is both available and enabled, SHALL include `bulk-archive` only when at least one active change is fully complete and that expanded command is both available and enabled, and SHALL include `continue` and `ff` only when at least one active change remains incomplete and those expanded commands are both available and enabled. The command buttons SHALL be rendered as a compact button row without a surrounding card, title, or description block.

#### Scenario: Show the always-available workspace commands on Home
- **WHEN** the operator views the Home surface
- **THEN** the UI shows copy buttons for `propose` and `explore` inline in the ACTIVE CHANGES section header

#### Scenario: Show incomplete-work workspace commands
- **WHEN** at least one active change still has incomplete tasks
- **THEN** the UI shows copy buttons for `continue` and `ff` only if those commands are available and enabled

#### Scenario: Show bulk archive when completed active changes exist
- **WHEN** at least one active change is fully complete
- **THEN** the UI shows a copy button for `bulk-archive` only if that command is available and enabled

#### Scenario: Copy a workspace command without arguments
- **WHEN** the operator activates a workspace command button
- **THEN** the system copies only the command text
- **AND** does not append a change name

#### Scenario: Show workspace commands in narrow-width home drawer
- **WHEN** the viewport width is less than 768px and the operator opens the Home drawer
- **THEN** the ACTIVE CHANGES section header in that drawer shows the same workspace command buttons as the persistent Explorer Pane
