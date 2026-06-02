## MODIFIED Requirements

### Requirement: Two-column settings layout
The settings dialog SHALL use a two-column layout with a left sidebar listing setting categories (General, Workflow, Commands, Versions) and a right content area showing the selected category's settings. Selecting a category in the sidebar SHALL update the right content area without closing the dialog. The General category SHALL include both theme settings and preview-tab behavior settings. The Versions category SHALL show version and update information for OpenSpec WebUI and OpenSpec CLI. The Workflow and Commands sections SHALL reuse shared OpenSpec documentation URL constants for their documentation links so those URLs remain consistent with other frontend surfaces. The Commands category SHALL render `sync` in the Core Commands group and SHALL NOT render `sync` in the Expanded Commands group, matching the OpenSpec core profile command list.

#### Scenario: Reuse shared OpenSpec docs links in Settings
- **WHEN** the Workflow or Commands section renders OpenSpec documentation links in Settings
- **THEN** those links reuse the shared OpenSpec docs URL constants
- **AND** the Workflow section links to the OpenSpec workflow reference and supported tools docs
- **AND** the Commands section links to the OpenSpec commands and workflows docs

#### Scenario: Sync is shown as a core command preference
- **WHEN** the operator opens the Commands section in Settings
- **THEN** the Core Commands group includes the `sync` command preference
- **AND** the Expanded Commands group does not include the `sync` command preference
- **AND** changing the `sync` visibility toggle updates the same persisted `sync` command preference used by command shortcut rendering
