## MODIFIED Requirements

### Requirement: Manage theme state via custom store
The system SHALL provide a `themeStore` object with a `value` getter that holds the current theme mode (`light`, `dark`, or `system`), a `setTheme` method to update and persist the theme, and an `initialize` method to load the saved preference on app mount. When the theme mode is `system`, the system SHALL remove the `data-theme` attribute from the `<html>` element rather than resolving to a specific light or dark value. The system SHALL listen to `prefers-color-scheme` media query changes when in System mode and re-apply the system theme. The selection SHALL be persisted to `localStorage`. The effective resolved theme (light or dark) SHALL NOT be exposed as explicit state on the store.

#### Scenario: Initialize theme store on app mount
- **WHEN** the application mounts
- **THEN** the theme store reads the saved preference from localStorage
- **AND** applies the theme to the `<html>` element

#### Scenario: Persist theme change to localStorage
- **WHEN** the user changes the theme mode via the store
- **THEN** the new mode is saved to localStorage
- **AND** the `<html>` element's `data-theme` attribute is updated

#### Scenario: System mode removes data-theme attribute
- **WHEN** the user selects System mode
- **THEN** the system removes the `data-theme` attribute from the `<html>` element
- **AND** the browser's `prefers-color-scheme` media query determines the effective appearance
