## MODIFIED Requirements

### Requirement: Provide dashboard and primary navigation context
The web UI SHALL provide top-level Home, Changes, and Specs views, SHALL show the shared application icon immediately before the current project name in navigation linking to the Home page, SHALL use `/app-icon.svg` for that navigation icon, SHALL show counts for specs and archived changes in navigation badges, and SHALL render the Home page with an Active Changes section (with a count badge in its header) and project documentation when available. The navigation SHALL NOT include a separate Dashboard link; the application icon and project title together SHALL link to the Home page. The navigation SHALL highlight the active section using direct reactive store access in the template expression to ensure reactivity. The navigation settings icon SHALL use the `Icon` component instead of inline SVG.

#### Scenario: Render the Home page
- **WHEN** the browser loads the Home page (`/`)
- **THEN** the system shows the Active Changes section with a count badge in the header
- **AND** lists active changes with their progress summaries
- **AND** renders the project documentation markdown when project content exists

#### Scenario: Show an empty active changes state
- **WHEN** the workspace has no active changes
- **THEN** the Home page shows `No active changes`

#### Scenario: Navigation highlights active section
- **WHEN** the operator navigates to a route under `/specs`
- **THEN** the Specs navigation button is visually highlighted
- **WHEN** the operator navigates to a route under `/changes`
- **THEN** the Changes navigation button is visually highlighted
- **WHEN** the operator navigates to the Home page (`/`)
- **THEN** no navigation button is highlighted (the logo serves as the Home link)

#### Scenario: Navigation uses Icon component for settings
- **WHEN** the navigation bar renders the settings button
- **THEN** the settings icon is rendered via the `Icon` component with `name="gear"`

#### Scenario: Navigation shows the shared application icon
- **WHEN** the navigation bar renders the home link
- **THEN** the system shows `/app-icon.svg` to the left of the current project name
- **AND** the icon and project name are presented as a single control that navigates to the Home page

## ADDED Requirements

### Requirement: Expose a shared application favicon
The app shell SHALL reference `/app-icon.svg` as the browser favicon so the same branding asset is used for the navigation and browser chrome.

#### Scenario: Browser loads the shared favicon reference
- **WHEN** the browser loads the application HTML shell
- **THEN** the document includes a `rel="icon"` link whose `href` is `/app-icon.svg`
- **AND** the app shell does not require a separate `/favicon.svg` asset for branding
