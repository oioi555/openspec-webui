# command-preferences Specification

## Purpose
Persist operator preferences for command syntax, expanded-command visibility, and theme selection in a settings dialog launched from the Activity Bar.
## Requirements
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

### Requirement: Icon component replaced by @lucide/svelte
The system SHALL replace the custom `Icon` Svelte component with `@lucide/svelte` icon imports throughout the application. All icon usage SHALL reference `@lucide/svelte` components directly.

#### Scenario: All icons use @lucide/svelte
- **WHEN** any component in the application renders an icon
- **THEN** the icon is imported from `@lucide/svelte`
- **AND** the custom `Icon.svelte` is not used

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

### Requirement: Provide theme selection in settings dialog
The settings dialog SHALL include an Appearance section with three radio options: Light, Dark, and System. The selected option SHALL immediately apply the corresponding theme without requiring page reload. The theme options SHALL be rendered as shared selection cards that align with the application's Card surface pattern.

#### Scenario: Select Light theme from settings
- **WHEN** the user selects the Light radio option in the Appearance section
- **THEN** the UI immediately switches to light colors
- **AND** the selection is persisted to localStorage

### Requirement: Provide language selection in settings dialog
The settings dialog SHALL include a Language section in the General category after the Theme section. The section SHALL provide `English` and `日本語` options through a listbox-style selection control, SHALL show the currently active locale, and SHALL apply the selected locale immediately. The language control SHALL use the shared Select / Card surface tone so its trigger, popup, hover, and selected states align with the settings selection cards.

#### Scenario: Show language selection in General settings
- **WHEN** the settings dialog opens
- **THEN** the General category shows a Language section after Theme
- **AND** the section lists `English` and `日本語`
- **AND** the currently active locale is selected in a listbox-style control

#### Scenario: Persist selected language from Settings
- **WHEN** the operator selects a different language option in the Language section
- **THEN** the application locale updates immediately
- **AND** the selection is persisted in browser storage

#### Scenario: Reopen Settings after changing language
- **WHEN** the operator changes the locale and later reopens the settings dialog
- **THEN** the Language section shows the saved locale as selected

### Requirement: Persist AI tool syntax preferences in the browser
The system SHALL let the operator choose between `standard`, `Claude Code`, and `skill` command syntax, SHALL interpret `standard` as `/opsx-<command>`, SHALL interpret `Claude Code` as `/opsx:<command>`, SHALL interpret `skill` as `/openspec-<command>`, and SHALL persist the selected AI tool in browser localStorage.

#### Scenario: Save the default syntax preference
- **WHEN** the operator selects the `standard` AI tool option
- **THEN** the system stores that preference in localStorage
- **AND** generated commands use the `/opsx-<command>` format

### Requirement: Persist independent command visibility preferences
The system SHALL provide independent visibility controls for core commands (`propose`, `explore`, `apply`, `archive`) and expanded commands (`new`, `continue`, `ff`, `verify`, `sync`, `bulk-archive`), SHALL persist each visibility value independently in browser localStorage.

#### Scenario: Update one command without changing others
- **WHEN** the operator changes the visibility setting for one command
- **THEN** the system updates only that command's saved visibility value

### Requirement: Gate expanded-command controls by workflow availability
The system SHALL inspect local OpenSpec workflow availability for the currently active project before enabling expanded-command controls. When the active project changes or no active project remains, the availability state SHALL be refreshed so command controls do not reflect the previously active project.

#### Scenario: Enable controls for detected workflows
- **WHEN** workflow inspection reports that `continue`, `ff`, and `verify` are available
- **THEN** the settings dialog enables the controls for those commands

#### Scenario: Refresh availability after switching projects
- **WHEN** the active project changes
- **THEN** the settings dialog refreshes workflow availability for the newly active project
- **AND** expanded-command controls reflect only that project's available workflows

#### Scenario: Clear availability when no project is active
- **WHEN** no project is active
- **THEN** the settings dialog shows expanded-command controls as unavailable
- **AND** does not reuse availability state from the previously active project

#### Scenario: Reconcile availability after websocket reconnect
- **WHEN** the client reconnects and learns that the active project changed while disconnected
- **THEN** the settings dialog refreshes workflow availability for the announced active project before rendering controls

### Requirement: Persist preview-tab preference in settings dialog
The settings dialog SHALL include a preview-tab mode toggle in the General section. The toggle SHALL default to enabled when no saved preference exists, SHALL persist the selected value in browser localStorage, and SHALL control whether Explorer single-click opens a reusable preview tab or a confirmed tab. When preview-tab mode is enabled, the settings description SHALL explain that Ctrl+Click / Cmd+Click or the Explorer item context menu can be used to open a regular tab.

#### Scenario: Preview-tab mode defaults to enabled
- **WHEN** the operator opens the settings dialog for the first time with no saved preview-tab preference
- **THEN** the preview-tab mode toggle is enabled

#### Scenario: Disable preview-tab mode
- **WHEN** the operator turns off preview-tab mode in the settings dialog
- **THEN** the system stores that preference in localStorage
- **AND** subsequent Explorer single-click actions open confirmed tabs instead of preview tabs

#### Scenario: Restore saved preview-tab mode
- **WHEN** the operator previously turned off preview-tab mode
- **AND** the application reloads
- **THEN** the settings dialog shows the toggle as disabled

### Requirement: Provide workflow selection cards in settings dialog
The settings dialog SHALL render each available workflow format option as a card-style radio choice that matches the visual selection pattern used by the Theme section. Each workflow card SHALL include an icon, a label, and a command-format preview, and SHALL visually highlight the selected option without changing the underlying workflow preference behavior.

#### Scenario: Show workflow format options as cards
- **WHEN** the operator opens the Workflow category in the settings dialog
- **THEN** each available workflow format option is shown as a card with an icon, label, and command preview
- **AND** the card selection affordance matches the Theme options in the same dialog

#### Scenario: Select a workflow from a card
- **WHEN** the operator selects one workflow card
- **THEN** that card becomes visually highlighted as the selected option
- **AND** the system stores the corresponding workflow preference value
- **AND** the Workflow section continues to show the command preview and help callout content
