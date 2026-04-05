# command-preferences Specification

## Purpose
Persists operator preferences for AI tool command syntax and expanded-command visibility in browser localStorage, with controls gated by local OpenSpec workflow availability.
## Requirements
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

### Requirement: Icon component for SVG icons
The system SHALL provide an `Icon` Svelte component that renders SVG icons by name prop. The component SHALL support the icon names used by the current UI, including `gear`, `close`, `chevron-left`, `chevron-right`, `command-line`, `list-check`, `document`, `archive-box`, `check-circle`, `circle`, `pencil-square`, `clipboard`, `pencil`, `trash`, and `document-arrow`. The component SHALL accept `class` and `size` props for styling. All SVG icons SHALL use `currentColor` for stroke/fill to inherit text color.

#### Scenario: Render a gear icon
- **WHEN** the `Icon` component is used with `name="gear"`
- **THEN** the gear SVG icon is rendered with the provided class and size

#### Scenario: Icon inherits text color
- **WHEN** the `Icon` component is wrapped in an element with `text-on-surface-muted` class
- **THEN** the icon's stroke color matches the muted text color

#### Scenario: Icon accepts custom class
- **WHEN** the `Icon` component receives `class="h-5 w-5"`
- **THEN** the rendered SVG element has the specified dimensions

### Requirement: Two-column settings layout
The settings modal SHALL use a two-column layout with a left sidebar listing setting categories (`General`, `AI Tool`, `Commands`) and a right content area showing the selected category's settings. Selecting a category in the sidebar SHALL update the right content area without closing the modal. On narrower widths where the sidebar stacks above the content, the category buttons SHALL render in a horizontal row with equal widths. The sidebar buttons SHALL use a simplified presentation with icon and label only.

#### Scenario: Show General settings by default
- **WHEN** the settings modal opens
- **THEN** the General category is selected in the left sidebar
- **AND** the right content area shows the Appearance (theme) settings

#### Scenario: Switch to AI Tool settings
- **WHEN** the user clicks the AI Tool category in the left/sidebar navigation
- **THEN** the right content area shows the AI Tool settings
- **AND** the General and Expanded Commands settings are hidden

#### Scenario: Switch to Commands settings
- **WHEN** the user clicks the Commands category in the left/sidebar navigation
- **THEN** the right content area shows the Expanded Commands settings
- **AND** the General and AI Tool settings are hidden

#### Scenario: Compact layout uses equal-width category buttons
- **WHEN** the viewport is narrow enough that the sidebar stacks above the content
- **THEN** the category buttons render horizontally
- **AND** each category button has the same width

#### Scenario: Highlight active category
- **WHEN** a category is selected in the left sidebar
- **THEN** that category is visually highlighted
- **AND** other categories show their default state

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

### Requirement: Persist AI tool syntax preferences in the browser
The system SHALL let the operator choose between `default` and `Claude Code` command syntax, SHALL interpret `default` as `/opsx-<command>`, SHALL interpret `Claude Code` as `/opsx:<command>`, and SHALL persist the selected AI tool in browser localStorage. The command preferences store SHALL use Svelte 5 `$state` rune for reactive state instead of `writable()`.

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

#### Scenario: Command preferences state is reactive via runes
- **WHEN** the command preferences store's `$state` value changes
- **THEN** all components reading the preference update automatically without `$store` prefix syntax

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
