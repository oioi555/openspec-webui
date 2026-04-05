## Purpose
Defines how the UI theme (light, dark, system) is defined, switched, persisted, and applied across all components.

## Requirements

### Requirement: Define semantic color tokens
The system SHALL define semantic color tokens via CSS custom properties in the `@theme` block, covering at minimum: background, surface, text, border, brand, and input colors. Each token SHALL have distinct values for light and dark themes.

#### Scenario: Light theme colors are applied
- **WHEN** the `<html>` element has `data-theme="light"`
- **THEN** all semantic color tokens resolve to their light theme values

#### Scenario: System mode resolves to light colors
- **WHEN** the `<html>` element has no `data-theme` attribute
- **AND** the operating system prefers a light color scheme
- **THEN** all semantic color tokens resolve to their light theme values

#### Scenario: Dark theme colors are applied
- **WHEN** the `<html>` element has `data-theme="dark"`
- **THEN** all semantic color tokens resolve to their dark theme values

#### Scenario: System mode resolves to dark colors
- **WHEN** the `<html>` element has no `data-theme` attribute
- **AND** the operating system prefers a dark color scheme
- **THEN** all semantic color tokens resolve to their dark theme values

### Requirement: Switch between light, dark, and system themes
The system SHALL provide three theme modes: Light, Dark, and System. When System is selected, the theme SHALL follow the operating system's `prefers-color-scheme` setting and update in real-time when the OS setting changes.

#### Scenario: User selects Light theme
- **WHEN** the user selects the Light theme option
- **THEN** the UI immediately switches to light colors
- **AND** the `<html>` element gets `data-theme="light"`

#### Scenario: User selects Dark theme
- **WHEN** the user selects the Dark theme option
- **THEN** the UI immediately switches to dark colors
- **AND** the `<html>` element gets `data-theme="dark"`

#### Scenario: User selects System theme
- **WHEN** the user selects the System theme option
- **THEN** the UI follows the OS color scheme preference
- **AND** updates automatically when the OS preference changes

#### Scenario: OS preference changes while System mode is active
- **WHEN** the OS switches from light to dark while System mode is active
- **THEN** the UI updates to dark theme immediately

### Requirement: Persist theme selection
The system SHALL persist the selected theme mode in browser `localStorage` under a dedicated key and SHALL restore it on subsequent visits. When no saved preference exists, the system SHALL default to Dark theme.

#### Scenario: Restore saved theme on page load
- **WHEN** the user opens the application after a previous visit
- **THEN** the theme from localStorage is applied immediately

#### Scenario: Saved theme is applied before app mount
- **WHEN** a saved theme exists in localStorage on page load
- **THEN** the initial document theme is applied before the Svelte application mounts
- **AND** the user does not see a flash of the wrong theme

#### Scenario: Default to dark theme for first visit
- **WHEN** the user opens the application for the first time (no localStorage value)
- **THEN** the dark theme is applied

### Requirement: Use semantic colors in all components
All Svelte components and CSS styles SHALL use semantic color tokens instead of hardcoded Tailwind color classes. No component SHALL reference raw gray-N, blue-N, or similar hardcoded colors for themable elements.

#### Scenario: All components respond to theme change
- **WHEN** the user switches from dark to light theme
- **THEN** every visible UI element (navigation, modals, cards, buttons, inputs, text, borders) reflects the light color scheme

#### Scenario: Markdown content responds to theme change
- **WHEN** the user switches themes while viewing markdown content
- **THEN** headings, body text, code blocks, links, tables, and blockquotes all reflect the current theme
