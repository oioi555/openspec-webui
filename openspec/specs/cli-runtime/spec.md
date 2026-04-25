# cli-runtime Specification

## Purpose
TBD - created by archiving change capture-baseline-specs. Update Purpose after archive.
## Requirements
### Requirement: Start a local workspace session
The system SHALL start the WebUI without requiring a positional workspace path argument, SHALL default the port to `3001`, SHALL bind to `127.0.0.1` unless configured otherwise, and SHALL bootstrap the current working directory when it points to a valid OpenSpec project root (or its `openspec/` directory). If the current working directory is not a valid OpenSpec project, the system SHALL still start normally and leave project selection to the UI. The user-facing `package.json` scripts surface SHALL be limited to the essential development commands: `dev`, `build`, `test`, and `typecheck`. npm lifecycle hooks such as `prepublishOnly` MAY remain. The CLI version displayed by `openspec-webui --version` SHALL match the current published package version defined by the package metadata source of truth.

#### Scenario: Start from a valid current working directory
- **WHEN** the operator runs `openspec-webui` from `/home/user/my-repo`
- **AND** the current working directory is a valid OpenSpec project
- **THEN** the system starts normally
- **AND** bootstraps that project into the registry as the active project

#### Scenario: Start from a non-project current working directory
- **WHEN** the operator runs `openspec-webui` from a directory without an `openspec/` subdirectory
- **THEN** the system starts normally
- **AND** no project is auto-added from the working directory

#### Scenario: Reject an occupied port
- **WHEN** the operator starts the UI on a port that is already in use
- **THEN** the system reports that the port is already in use
- **AND** suggests trying another port

#### Scenario: README describes installation and usage for npm users
- **WHEN** a user visits the GitHub repository or npm page
- **THEN** the README SHALL provide clear installation instructions (`npm install -g openspec-webui` or `npx openspec-webui`)
- **AND** SHALL provide basic usage instructions (CLI commands, options)
- **AND** SHALL include a separate section for contributors (dev setup, build, test)

#### Scenario: Display version from package metadata
- **WHEN** the operator runs `openspec-webui --version`
- **THEN** the displayed version matches the current package version published from the package metadata source of truth

### Requirement: Manage browser launch and session controls
The system SHALL open the browser to the running UI by default, SHALL skip auto-opening when `--no-open` is supplied, SHALL reopen the current UI URL when the operator presses `l` in an interactive terminal session, and SHALL shut down cleanly on `Ctrl+C`.

#### Scenario: Auto-open the browser on startup
- **WHEN** the operator starts the UI without `--no-open`
- **THEN** the system launches the default browser to the running local URL

#### Scenario: Skip browser auto-open
- **WHEN** the operator starts the UI with `--no-open`
- **THEN** the system starts the local server without launching a browser window

#### Scenario: Reopen the UI from the terminal
- **WHEN** the server is running in an interactive terminal and the operator presses `l`
- **THEN** the system launches the current UI URL in the browser again

### Requirement: Serve the web application shell
The system SHALL expose the JSON API routes, the websocket endpoint, and the browser UI from the same local server, and SHALL return the SPA entry document for non-API and non-websocket paths when a built frontend is available. The frontend build pipeline SHALL use Tailwind CSS v4 via the `@tailwindcss/vite` Vite plugin, eliminating PostCSS dependencies. Frontend CSS SHALL use `@import "tailwindcss"`, `@plugin "@tailwindcss/typography"`, and `@theme` directives instead of `@tailwind` directives and a separate JavaScript config file.

#### Scenario: Load a deep-linked UI route
- **WHEN** a browser requests a non-API UI path such as `/specs/<name>`
- **THEN** the system returns the SPA entry document
- **AND** allows the frontend router to resolve the view

#### Scenario: Start without built frontend assets
- **WHEN** the frontend build output is unavailable
- **THEN** the server still starts
- **AND** logs a warning that the frontend build is missing

#### Scenario: Frontend builds with Tailwind v4 and typography plugin
- **WHEN** the frontend build is executed via Vite
- **THEN** Tailwind CSS v4 processes styles via the `@tailwindcss/vite` plugin
- **AND** `@tailwindcss/typography` styles are loaded via CSS `@plugin`
- **AND** no PostCSS configuration is required

#### Scenario: Existing @apply directives remain functional
- **WHEN** the CSS contains `@apply` directives (e.g., markdown overrides and diff styles)
- **THEN** Tailwind v4 SHALL resolve and apply all utility classes correctly
- **AND** the visual output matches the intended themed appearance

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
