## MODIFIED Requirements

### Requirement: Two-column settings layout
The settings dialog SHALL use a two-column layout with a left sidebar listing setting categories (General, Workflow, Commands, Versions) and a right content area showing the selected category's settings. Selecting a category in the sidebar SHALL update the right content area without closing the dialog. The General category SHALL include both theme settings and preview-tab behavior settings. The Versions category SHALL show version and update information for OpenSpec WebUI and OpenSpec CLI. The Workflow and Commands sections SHALL reuse shared OpenSpec documentation URL constants for their documentation links so those URLs remain consistent with other frontend surfaces. The Commands category SHALL render `sync` and `update` in the Core Commands group, SHALL NOT render `sync` or `update` in the Expanded Commands group, and SHALL NOT render `onboard` in either group, matching the OpenSpec v1.8 core profile command list.

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

#### Scenario: Update is shown as a v1.8 core command preference
- **WHEN** the operator opens the Commands section in Settings
- **THEN** the Core Commands group includes the `update` command preference
- **AND** the Expanded Commands group does not include the `update` command preference
- **AND** changing the `update` visibility toggle updates the same persisted `update` command preference used by command shortcut rendering

#### Scenario: Onboard is never shown as a command preference
- **WHEN** the operator opens the Commands section in Settings
- **THEN** the `onboard` command preference is not rendered in the Core Commands group or the Expanded Commands group
