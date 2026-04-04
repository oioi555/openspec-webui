## ADDED Requirements

### Requirement: Launch command settings from primary navigation
The web UI SHALL provide a command settings launcher at the far right edge of the primary navigation and SHALL open a modal dialog for command preferences when the launcher is activated.

#### Scenario: Open command settings from the navigation bar
- **WHEN** the operator activates the settings launcher from the primary navigation
- **THEN** the system opens the command settings modal
- **AND** shows the current command preference values

#### Scenario: Return to the current view after closing settings
- **WHEN** the operator dismisses the command settings modal
- **THEN** the system closes the modal without navigating away from the current view

### Requirement: Persist AI tool syntax preferences in the browser
The system SHALL let the operator choose between `default` and `Claude Code` command syntax, SHALL interpret `default` as `/opsx-<command>`, SHALL interpret `Claude Code` as `/opsx:<command>`, and SHALL persist the selected AI tool in browser localStorage.

#### Scenario: Save the default syntax preference
- **WHEN** the operator selects the `default` AI tool option
- **THEN** the system stores that preference in localStorage
- **AND** generated commands use the `/opsx-<command>` format

#### Scenario: Save the Claude Code syntax preference
- **WHEN** the operator selects the `Claude Code` AI tool option
- **THEN** the system stores that preference in localStorage
- **AND** generated commands use the `/opsx:<command>` format

#### Scenario: Restore the saved AI tool preference
- **WHEN** the operator reloads the application in the same browser
- **THEN** the system restores the last saved AI tool preference from localStorage

### Requirement: Persist independent expanded-command visibility preferences
The system SHALL provide independent visibility controls for the expanded commands `new`, `continue`, `ff`, `verify`, `sync`, and `bulk-archive`, SHALL persist each visibility value independently in browser localStorage, and SHALL not provide show/hide toggles for the core commands `propose`, `explore`, `apply`, and `archive`.

#### Scenario: Update one expanded command without changing others
- **WHEN** the operator changes the visibility setting for one expanded command
- **THEN** the system updates only that command's saved visibility value
- **AND** preserves the saved values for the other expanded commands

#### Scenario: Restore saved expanded command visibility
- **WHEN** the operator reloads the application in the same browser
- **THEN** the system restores the saved per-command visibility values from localStorage

### Requirement: Gate expanded-command controls by workflow availability
The system SHALL inspect local OpenSpec workflow availability before enabling expanded-command controls, SHALL enable each expanded-command control only when the corresponding workflow is reported as available, and SHALL disable the expanded-command controls when workflow availability cannot be loaded.

#### Scenario: Enable controls for detected workflows
- **WHEN** workflow inspection reports that `continue`, `ff`, and `verify` are available
- **THEN** the settings modal enables the controls for `continue`, `ff`, and `verify`
- **AND** leaves unavailable expanded commands disabled

#### Scenario: Disable unavailable workflows individually
- **WHEN** workflow inspection reports that an expanded command such as `sync` is not available
- **THEN** the settings modal shows `sync` as unavailable
- **AND** prevents the operator from enabling its visibility

#### Scenario: Disable expanded-command settings when workflow inspection fails
- **WHEN** the system cannot load workflow availability from the local OpenSpec CLI
- **THEN** the settings modal disables the expanded-command controls
- **AND** indicates that expanded command availability could not be detected
