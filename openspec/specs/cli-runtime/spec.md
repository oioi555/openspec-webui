# cli-runtime Specification

## Purpose
TBD - created by archiving change capture-baseline-specs. Update Purpose after archive.
## Requirements
### Requirement: Start a local workspace session
The system SHALL start the WebUI without requiring a positional workspace path argument, SHALL default the port to `3001`, SHALL bind to `127.0.0.1` unless configured otherwise, and SHALL bootstrap an initial project from the `OPENSPEC_INITIAL_PROJECT` environment variable when it is set to a valid OpenSpec project path. Wrapper scripts MAY translate their own convenience arguments into `OPENSPEC_INITIAL_PROJECT`, but the standalone CLI contract SHALL remain argument-free for project selection.

#### Scenario: Start with defaults
- **WHEN** the operator runs `openspec-webui` without a path or port option
- **THEN** the system starts without validating the current working directory as a workspace
- **AND** the local server listens on port `3001`

#### Scenario: Start with OPENSPEC_INITIAL_PROJECT
- **WHEN** the operator starts the UI with `OPENSPEC_INITIAL_PROJECT=/home/user/my-repo`
- **AND** the path points to a valid OpenSpec project
- **THEN** the system starts normally
- **AND** bootstraps that project into the registry as the active project

#### Scenario: Ignore an invalid OPENSPEC_INITIAL_PROJECT
- **WHEN** the operator starts the UI with `OPENSPEC_INITIAL_PROJECT` set to an invalid path
- **THEN** the system reports a warning
- **AND** continues starting the server without exiting

#### Scenario: Wrapper script maps a project argument to bootstrap env
- **WHEN** the operator runs a wrapper such as `npm run dev -- /path/to/project`
- **THEN** the wrapper passes `/path/to/project` via `OPENSPEC_INITIAL_PROJECT`
- **AND** does not pass a positional workspace path argument to `openspec-webui`

#### Scenario: Reject an occupied port
- **WHEN** the operator starts the UI on a port that is already in use
- **THEN** the system reports that the port is already in use
- **AND** suggests trying another port

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
