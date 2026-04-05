## MODIFIED Requirements

### Requirement: Launch command settings from primary navigation
The web UI SHALL provide a command settings launcher at the far right edge of the primary navigation and SHALL open a modal dialog for command preferences and theme settings when the launcher is activated.

#### Scenario: Open command settings from the navigation bar
- **WHEN** the operator activates the settings launcher from the primary navigation
- **THEN** the system opens the settings modal
- **AND** shows the current command preference values
- **AND** shows the current theme selection

#### Scenario: Return to the current view after closing settings
- **WHEN** the operator dismisses the settings modal
- **THEN** the system closes the modal without navigating away from the current view

## ADDED Requirements

### Requirement: Provide theme selection in settings modal
The settings modal SHALL include an Appearance section with three radio options: Light, Dark, and System. The selected option SHALL immediately apply the corresponding theme without requiring page reload.

#### Scenario: Select Light theme from settings
- **WHEN** the user selects the Light radio option in the Appearance section
- **THEN** the UI immediately switches to light colors
- **AND** the selection is persisted to localStorage

#### Scenario: Select Dark theme from settings
- **WHEN** the user selects the Dark radio option in the Appearance section
- **THEN** the UI immediately switches to dark colors
- **AND** the selection is persisted to localStorage

#### Scenario: Select System theme from settings
- **WHEN** the user selects the System radio option in the Appearance section
- **THEN** the UI follows the OS color scheme preference
- **AND** the selection is persisted to localStorage
