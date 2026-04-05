## MODIFIED Requirements

### Requirement: Persist theme selection
The system SHALL persist the selected theme mode in browser `localStorage` under a dedicated key and SHALL restore it on subsequent visits. When no saved preference exists, the system SHALL default to Dark theme. The theme store implementation SHALL use Svelte 5 `$state` rune instead of `writable()` for internal state, and SHALL expose the current theme as a reactive value that components can import directly.

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

#### Scenario: Theme state is reactive via runes
- **WHEN** the theme store's `$state` value changes
- **THEN** all components reading the theme value update automatically without `$store` prefix syntax
