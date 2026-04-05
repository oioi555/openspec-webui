## ADDED Requirements

### Requirement: Manage theme state via Svelte store
The system SHALL provide a `themeStore` Svelte writable store that holds the current theme mode (`light`, `dark`, or `system`), resolves the effective theme, applies it to the `<html>` element's `data-theme` attribute, listens to `prefers-color-scheme` changes when in System mode, and persists the selection to `localStorage`.

#### Scenario: Initialize theme store on app mount
- **WHEN** the application mounts
- **THEN** the theme store reads the saved preference from localStorage
- **AND** applies the resolved theme to the `<html>` element

#### Scenario: Persist theme change to localStorage
- **WHEN** the user changes the theme mode via the store
- **THEN** the new mode is saved to localStorage
- **AND** the `<html>` element's `data-theme` attribute is updated
