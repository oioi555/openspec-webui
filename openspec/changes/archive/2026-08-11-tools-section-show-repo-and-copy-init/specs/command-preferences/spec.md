## MODIFIED Requirements

### Requirement: Two-column settings layout
The settings dialog SHALL use a two-column layout with a left sidebar listing setting categories (General, Tools, Commands, Versions) and a right content area showing the selected category's settings. Selecting a category in the sidebar SHALL update the right content area without closing the dialog. The General category SHALL include both theme settings and preview-tab behavior settings. The Versions category SHALL show version and update information for OpenSpec WebUI and OpenSpec CLI. The Tools and Commands sections SHALL reuse shared OpenSpec documentation URL constants for their documentation links so those URLs remain consistent with other frontend surfaces. The Tools section SHALL be read-only: it SHALL explain how OpenSpec installs per-tool commands and skills, SHALL link to the official supported-tools documentation, SHALL link to the `openspec init` CLI reference, SHALL explain that per-repository integrations are added or removed by re-running `openspec init`, SHALL display the active repository path, SHALL expose a copyable `openspec init <active-repository-path>` command block that places the command on the clipboard without executing it, SHALL list the integrations detected for the active repository, and SHALL NOT include any command-format selection control. The Commands category SHALL render `sync` and `update` in the Core Commands group, SHALL NOT render `sync` or `update` in the Expanded Commands group, and SHALL NOT render `onboard` in either group, matching the OpenSpec v1.8 core profile command list.

#### Scenario: Reuse shared OpenSpec docs links in Settings
- **WHEN** the Tools or Commands section renders OpenSpec documentation links in Settings
- **THEN** those links reuse the shared OpenSpec docs URL constants
- **AND** the Tools section links to the OpenSpec supported tools docs and the `openspec init` CLI reference
- **AND** the Commands section links to the OpenSpec commands and workflows docs

#### Scenario: Tools section is read-only with no format selection
- **WHEN** the operator opens the Tools section in Settings
- **THEN** no Standard / Claude Code / Skill command-format selection control is rendered
- **AND** the section shows read-only integration information including a supported-tools documentation link and `openspec init` guidance

#### Scenario: Tools section copy affordance stays read-only
- **WHEN** the operator activates the copyable `openspec init <active-repository-path>` affordance in the Tools section
- **THEN** the command is placed on the clipboard only
- **AND** the section does not execute `openspec init` from the browser
- **AND** no command-format selection control is introduced by the copy affordance

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
