## MODIFIED Requirements

### Requirement: Launch command settings from Activity Bar
The web UI SHALL provide a Settings icon in the Activity Bar. Clicking the Settings icon SHALL open a settings dialog for command preferences and theme settings.

#### Scenario: Open command settings from Activity Bar
- **WHEN** the operator clicks the Settings icon in the Activity Bar
- **THEN** the system opens the settings dialog
- **AND** shows the current command preference values
- **AND** shows the current theme selection

#### Scenario: Return to the current view after closing settings
- **WHEN** the operator dismisses the settings dialog
- **THEN** the system closes the dialog without changing the active tab

### Requirement: Icon component replaced by @lucide/svelte
The system SHALL replace the custom `Icon` Svelte component with `@lucide/svelte` icon imports throughout the application. All icon usage SHALL reference `@lucide/svelte` components directly.

#### Scenario: All icons use @lucide/svelte
- **WHEN** any component in the application renders an icon
- **THEN** the icon is imported from `@lucide/svelte`
- **AND** the custom `Icon.svelte` is not used

### Requirement: Two-column settings layout
The settings dialog SHALL use a two-column layout with a left sidebar listing setting categories (General, AI Tool, Commands) and a right content area showing the selected category's settings. Selecting a category in the sidebar SHALL update the right content area without closing the dialog.

#### Scenario: Show General settings by default
- **WHEN** the settings dialog opens
- **THEN** the General category is selected in the left sidebar
- **AND** the right content area shows the Appearance (theme) settings

#### Scenario: Switch to AI Tool settings
- **WHEN** the user clicks the AI Tool category in the sidebar navigation
- **THEN** the right content area shows the AI Tool settings

### Requirement: Provide theme selection in settings dialog
The settings dialog SHALL include an Appearance section with three radio options: Light, Dark, and System. The selected option SHALL immediately apply the corresponding theme without requiring page reload.

#### Scenario: Select Light theme from settings
- **WHEN** the user selects the Light radio option in the Appearance section
- **THEN** the UI immediately switches to light colors
- **AND** the selection is persisted to localStorage

### Requirement: Persist AI tool syntax preferences in the browser
The system SHALL let the operator choose between `default` and `Claude Code` command syntax, SHALL interpret `default` as `/opsx-<command>`, SHALL interpret `Claude Code` as `/opsx:<command>`, and SHALL persist the selected AI tool in browser localStorage.

#### Scenario: Save the default syntax preference
- **WHEN** the operator selects the `default` AI tool option
- **THEN** the system stores that preference in localStorage
- **AND** generated commands use the `/opsx-<command>` format

### Requirement: Persist independent expanded-command visibility preferences
The system SHALL provide independent visibility controls for the expanded commands `new`, `continue`, `ff`, `verify`, `sync`, and `bulk-archive`, SHALL persist each visibility value independently in browser localStorage.

#### Scenario: Update one expanded command without changing others
- **WHEN** the operator changes the visibility setting for one expanded command
- **THEN** the system updates only that command's saved visibility value

### Requirement: Gate expanded-command controls by workflow availability
The system SHALL inspect local OpenSpec workflow availability before enabling expanded-command controls.

#### Scenario: Enable controls for detected workflows
- **WHEN** workflow inspection reports that `continue`, `ff`, and `verify` are available
- **THEN** the settings dialog enables the controls for those commands
