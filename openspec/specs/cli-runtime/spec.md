# cli-runtime Specification

## Purpose
Define the Web UI CLI runtime contract for startup, host and port configuration, initial project resolution, and packaged execution.

## Requirements

### Requirement: Start a local workspace session
The system SHALL start the WebUI without requiring a positional workspace path argument, default to port `3001` and host `127.0.0.1`, and bind to the `--host <address>` value when provided. It SHALL bootstrap the current working directory when it is a valid OpenSpec project root or its `openspec/` directory; otherwise it SHALL start normally and leave project selection to the UI. The version shown by `openspec-webui --version` SHALL match the current published package version.

#### Scenario: Start from a valid current working directory
- **WHEN** the operator runs `openspec-webui` from `/home/user/my-repo`
- **AND** the current working directory is a valid OpenSpec project
- **THEN** the system starts normally
- **AND** bootstraps that project into the registry as the active project
- **AND** the same bootstrap applies when the current working directory is the project's `openspec/` directory

#### Scenario: Start from a non-project current working directory
- **WHEN** the operator runs `openspec-webui` from a directory without an `openspec/` subdirectory
- **THEN** the system starts normally
- **AND** no project is auto-added from the working directory
- **AND** project selection is left to the UI

#### Scenario: Reject an occupied port
- **WHEN** the operator starts the UI on a port that is already in use
- **THEN** the system reports that the port is already in use
- **AND** suggests trying another port

#### Scenario: README describes installation and usage for npm users
- **WHEN** a user visits the GitHub repository or npm page
- **THEN** the README SHALL provide clear installation instructions (`npm install -g openspec-webui` or `npx openspec-webui`)
- **AND** SHALL provide basic usage instructions (CLI commands, options including `--host`)
- **AND** SHALL include a separate section for contributors (dev setup, build, test)

#### Scenario: Package scripts are limited to essential development commands
- **WHEN** a contributor inspects the user-facing `package.json` scripts
- **THEN** the scripts surface is limited to `dev`, `build`, `test`, and `typecheck`
- **AND** npm lifecycle hooks such as `prepublishOnly` MAY remain

#### Scenario: Start with default localhost binding
- **WHEN** the operator runs `openspec-webui` without `--host`
- **THEN** the system binds to `127.0.0.1`
- **AND** the browser opens to `http://127.0.0.1:3001`

#### Scenario: Bind to all interfaces for network access
- **WHEN** the operator runs `openspec-webui --host 0.0.0.0`
- **THEN** the system binds to `0.0.0.0`
- **AND** the browser opens to `http://localhost:3001` (not `0.0.0.0`)

#### Scenario: Display version from package metadata
- **WHEN** the operator runs `openspec-webui --version`
- **THEN** the displayed version matches the current package version published from the package metadata source of truth

### Requirement: Manage browser launch and session controls
The system SHALL open the browser to the running UI by default using a localhost URL, SHALL skip auto-opening when `--no-open` is supplied, SHALL reopen the current UI URL with localhost when the operator presses `l` in an interactive terminal session even when bound to `0.0.0.0`, and SHALL shut down cleanly on `Ctrl+C`.

#### Scenario: Auto-open the browser on startup
- **WHEN** the operator starts the UI without `--no-open`
- **THEN** the system launches the default browser to `http://localhost:<port>` (or the bound host if not `0.0.0.0`)

#### Scenario: Auto-open with 0.0.0.0 binding uses localhost
- **WHEN** the operator starts the UI with `--host 0.0.0.0` without `--no-open`
- **THEN** the browser opens to `http://localhost:<port>` instead of `http://0.0.0.0:<port>`

#### Scenario: Skip browser auto-open
- **WHEN** the operator starts the UI with `--no-open`
- **THEN** the system starts the local server without launching a browser window

#### Scenario: Reopen the UI from the terminal
- **WHEN** the server is running in an interactive terminal and the operator presses `l`
- **THEN** the system launches the current UI URL in the browser using localhost

### Requirement: Serve the web application shell
The system SHALL expose the JSON API routes, the websocket endpoint, and the browser UI from the same local server, and SHALL return the SPA entry document for non-API and non-websocket paths when a built frontend is available. The frontend build pipeline SHALL use Tailwind CSS v4 via the `@tailwindcss/vite` Vite plugin, with no PostCSS dependencies and no separate JavaScript Tailwind config file.

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
- **AND** frontend CSS uses `@import "tailwindcss"`, `@plugin "@tailwindcss/typography"`, and `@theme` directives instead of `@tailwind` directives and a separate JavaScript config file

#### Scenario: Existing @apply directives remain functional
- **WHEN** the CSS contains `@apply` directives (e.g., markdown overrides and diff styles)
- **THEN** Tailwind v4 SHALL resolve and apply all utility classes correctly
- **AND** the visual output matches the intended themed appearance

### Requirement: Manage theme state via custom store
The system SHALL provide a `themeStore` object with a `value` getter for the current theme mode (`light`, `dark`, or `system`), a `setTheme` method that updates the mode and persists it to `localStorage`, and an `initialize` method that loads the saved preference on app mount. In `system` mode the system SHALL remove the `data-theme` attribute from `<html>` and re-apply the system theme when `prefers-color-scheme` changes. The store SHALL NOT expose the effective resolved theme as state.

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
- **AND** the attribute is not resolved to a specific light or dark value

#### Scenario: System mode follows color scheme changes
- **WHEN** the theme mode is `system` and the `prefers-color-scheme` media query changes
- **THEN** the system re-applies the system theme
- **AND** the store does not expose the effective resolved theme as explicit state
