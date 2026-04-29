## MODIFIED Requirements

### Requirement: Launch command settings from Activity Bar
The web UI SHALL provide a Settings icon in the Activity Bar. Clicking the Settings icon SHALL open a settings dialog for command preferences, theme settings, preview-tab behavior settings, and version/update information for OpenSpec WebUI and OpenSpec CLI.

#### Scenario: Open command settings from Activity Bar
- **WHEN** the operator clicks the Settings icon in the Activity Bar
- **THEN** the system opens the settings dialog
- **AND** shows the current command preference values
- **AND** shows the current theme selection
- **AND** shows whether preview tabs are enabled
- **AND** makes the `Versions` category available in the settings sidebar

#### Scenario: Return to the current view after closing settings
- **WHEN** the operator dismisses the settings dialog
- **THEN** the system closes the dialog without changing the active tab

### Requirement: Two-column settings layout
The settings dialog SHALL use a two-column layout with a left sidebar listing setting categories (General, Workflow, Commands, Versions) and a right content area showing the selected category's settings. Selecting a category in the sidebar SHALL update the right content area without closing the dialog. The General category SHALL include both theme settings and preview-tab behavior settings. The Versions category SHALL show version and update information for OpenSpec WebUI and OpenSpec CLI.

#### Scenario: Show General settings by default
- **WHEN** the settings dialog opens
- **THEN** the General category is selected in the left sidebar
- **AND** the right content area shows the Appearance (theme) settings
- **AND** the right content area shows the preview-tab mode toggle

#### Scenario: Switch to Workflow settings
- **WHEN** the user clicks the Workflow category in the sidebar navigation
- **THEN** the right content area shows the Workflow settings

#### Scenario: Switch to Versions settings
- **WHEN** the user clicks the Versions category in the sidebar navigation
- **THEN** the right content area shows version and update information for OpenSpec WebUI and OpenSpec CLI
