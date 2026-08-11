## MODIFIED Requirements

### Requirement: Two-column settings layout
The settings dialog SHALL use a two-column layout with a left sidebar listing setting categories (General, Tools, Commands, Versions) and a right content area showing the selected category's settings. Selecting a category in the sidebar SHALL update the right content area without closing the dialog. The General category SHALL include both theme settings and preview-tab behavior settings. The Versions category SHALL show version and update information for OpenSpec WebUI and OpenSpec CLI. The Tools and Commands sections SHALL reuse shared OpenSpec documentation URL constants for their documentation links so those URLs remain consistent with other frontend surfaces. The Tools section SHALL be read-only: it SHALL explain how OpenSpec installs per-tool commands and skills, SHALL link to the official supported-tools documentation, SHALL explain that per-repository integrations are added or removed by re-running `openspec init`, SHALL list the integrations detected for the active repository, and SHALL NOT include any command-format selection control. The Commands category SHALL render `sync` and `update` in the Core Commands group, SHALL NOT render `sync` or `update` in the Expanded Commands group, and SHALL NOT render `onboard` in either group, matching the OpenSpec v1.8 core profile command list.

The Commands category SHALL render, for each listed command, a one-line localized description of what the command does, sourced from the shared workflow metadata structure so the metadata remains the single source of truth. The Commands category SHALL include a refresh control in its section header that re-runs the same availability detection used by the Tools section. The Core Commands group and the Expanded Commands group are classifications only — the OpenSpec `core` profile is the default set, not a guarantee that those commands are present in any given installation — so both groups SHALL apply the same availability rule: a command is shown as toggleable only when the CLI-reported `workflows` list includes it. Each row SHALL render a checkbox matching the checkbox styling used by other Settings sections when the command is present in the CLI-reported `workflows` list, and SHALL render a circle-off icon in place of the checkbox when the command is absent from the `workflows` list (the operator cannot toggle it from this row while it remains absent). The Commands category SHALL NOT render a shared availability caption, a separate per-row unavailable marker, a per-row waiting status string, or any warning Callout whose trigger is "Expanded commands are unavailable" — the checkbox / circle-off pair is the single source of per-row availability truth. The Commands category SHALL NOT render an enablement guide whose trigger is the missing Expanded commands; instead it SHALL render, below the command groups and always visible, a single copyable command block for `openspec config profile` using the same code-plus-copy-button affordance used by the Tools and Versions sections, with a caption explaining that the command opens the interactive global workflow selector and that running `openspec update` in the project is required afterwards. Copying the command SHALL place it on the clipboard only; the section SHALL NOT execute any command from the browser. The existing visibility-toggle persistence behavior, documentation links paragraph, and availability/profile status indicator in the section header are preserved.

#### Scenario: Reuse shared OpenSpec docs links in Settings
- **WHEN** the Tools or Commands section renders OpenSpec documentation links in Settings
- **THEN** those links reuse the shared OpenSpec docs URL constants
- **AND** the Tools section links to the OpenSpec supported tools docs
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

#### Scenario: Each Commands section row renders a one-line description
- **WHEN** the operator views any command row in the Commands section
- **THEN** the row renders a one-line localized description of what the command does
- **AND** that description is sourced from the shared workflow metadata structure via its message id

#### Scenario: Commands section has its own refresh control
- **WHEN** the operator opens the Commands section in Settings
- **THEN** a refresh control is rendered in the Commands section header
- **AND** activating it re-runs the same availability detection used by the Tools section
- **AND** the Core Commands and Expanded Commands rows update to reflect the refreshed availability

#### Scenario: Commands section renders a checkbox or a circle-off icon per row
- **WHEN** the operator views a command row whose command is present in the CLI-reported `workflows` list
- **THEN** the row renders a checkbox matching the checkbox styling used by other Settings sections
- **AND** the operator can toggle the checkbox to change the persisted visibility preference for that command
- **WHEN** the operator views a command row whose command is absent from the `workflows` list
- **THEN** the row renders a circle-off icon in place of the checkbox
- **AND** the operator cannot toggle it from this row while it remains absent

#### Scenario: Commands section drops per-row status strings, shared captions, and warning callouts
- **WHEN** the operator views the Commands section
- **THEN** no row renders a per-row "always available", "available", "unavailable", or "waiting" status string
- **AND** no shared availability caption is rendered for the Core or Expanded group
- **AND** no warning Callout is rendered whose trigger is "Expanded commands are unavailable"
- **AND** the checkbox / circle-off pair is the single source of per-row availability truth

#### Scenario: Commands section renders an always-visible openspec config profile copy block
- **WHEN** the operator views the Commands section
- **THEN** a single copyable command block for `openspec config profile` is rendered below the command groups and is always visible regardless of which commands are or are not in the `workflows` list
- **AND** the block uses the same code-plus-copy-button affordance used by the Tools and Versions sections
- **AND** a caption explains that the command opens the interactive global workflow selector and that running `openspec update` in the project is required afterwards
- **AND** activating the copy control places `openspec config profile` on the clipboard only and does not execute it

#### Scenario: Commands section header labels the reported profile as global
- **WHEN** the Commands section header renders the availability/profile status indicator and availability detection reports a profile
- **THEN** the indicator labels the profile as a global profile (e.g. "Global profile: custom"), not a local one
- **AND** the wording is consistent with the section's other "global OpenSpec workflows" copy
