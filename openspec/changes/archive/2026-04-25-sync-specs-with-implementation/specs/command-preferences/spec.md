## MODIFIED Requirements

### Requirement: Two-column settings layout
The settings dialog SHALL use a two-column layout with a left sidebar listing setting categories (General, Workflow, Commands) and a right content area showing the selected category's settings. Selecting a category in the sidebar SHALL update the right content area without closing the dialog. The General category SHALL include both theme settings and preview-tab behavior settings.

#### Scenario: Show General settings by default
- **WHEN** the settings dialog opens
- **THEN** the General category is selected in the left sidebar
- **AND** the right content area shows the Appearance (theme) settings
- **AND** the right content area shows the preview-tab mode toggle

#### Scenario: Switch to Workflow settings
- **WHEN** the user clicks the Workflow category in the sidebar navigation
- **THEN** the right content area shows the Workflow settings

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
