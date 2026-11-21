# command-preferences Specification

## Purpose
Settings for OpenSpec command visibility and preferences.

## Requirements

### Requirement: Two-column settings layout
The settings dialog SHALL use a two-column layout with a left sidebar listing setting categories (General, Tools, Commands, Versions) and a right content area showing the selected category's settings. Selecting a category SHALL update the right content area without closing the dialog. The Tools and Commands sections SHALL reuse shared OpenSpec documentation URL constants for their documentation links.

#### Scenario: Selecting a settings category
- **WHEN** the operator selects General, Tools, Commands, or Versions in the settings sidebar
- **THEN** the right content area shows that category's settings
- **AND** the dialog stays open
- **AND** the General category shows both theme settings and preview-tab behavior settings
- **AND** the Versions category shows version and update information for OpenSpec WebUI and OpenSpec CLI

#### Scenario: Reuse shared OpenSpec docs links in Settings
- **WHEN** the Tools or Commands section renders OpenSpec documentation links in Settings
- **THEN** those links reuse the shared OpenSpec docs URL constants
- **AND** the URLs remain consistent with other frontend surfaces
- **AND** the Tools section links to the OpenSpec supported tools docs and the `openspec init` CLI reference
- **AND** the Commands section links to the OpenSpec commands and workflows docs

#### Scenario: Tools section is read-only with no format selection
- **WHEN** the operator opens the Tools section in Settings
- **THEN** no Standard / Claude Code / Skill command-format selection control is rendered
- **AND** the section shows read-only integration information including a supported-tools documentation link and `openspec init` guidance
- **AND** the guidance explains how OpenSpec installs per-tool commands and skills and that per-repository integrations are added or removed by re-running `openspec init`
- **AND** the section displays the active repository path and lists the integrations detected for the active repository

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
- **WHEN** the operator views a command row in either the Core Commands or Expanded Commands group whose command is present in the CLI-reported `workflows` list
- **THEN** the row renders a checkbox matching the checkbox styling used by other Settings sections
- **AND** the operator can toggle the checkbox to change the persisted visibility preference for that command
- **WHEN** the operator views a command row whose command is absent from the `workflows` list
- **THEN** the row renders a circle-off icon in place of the checkbox
- **AND** the operator cannot toggle it from this row while it remains absent

#### Scenario: Commands section drops per-row status strings, shared captions, and warning callouts
- **WHEN** the operator views the Commands section
- **THEN** no row renders a per-row "always available", "available", "unavailable", or "waiting" status string
- **AND** no shared availability caption is rendered for the Core or Expanded group
- **AND** no separate per-row unavailable marker is rendered
- **AND** no warning Callout is rendered whose trigger is "Expanded commands are unavailable"
- **AND** the checkbox / circle-off pair is the single source of per-row availability truth

#### Scenario: Commands section renders an always-visible openspec config profile copy block
- **WHEN** the operator views the Commands section
- **THEN** a single copyable command block for `openspec config profile` is rendered below the command groups and is always visible regardless of which commands are or are not in the `workflows` list
- **AND** the block uses the same code-plus-copy-button affordance used by the Tools and Versions sections
- **AND** a caption explains that the command opens the interactive global workflow selector and that running `openspec update` in the project is required afterwards
- **AND** activating the copy control places `openspec config profile` on the clipboard only and does not execute it
- **AND** no enablement guide triggered by missing Expanded commands is rendered

#### Scenario: Commands section header labels the reported profile as global
- **WHEN** the Commands section header renders the availability/profile status indicator and availability detection reports a profile
- **THEN** the indicator labels the profile as a global profile (e.g. "Global profile: custom"), not a local one
- **AND** the wording is consistent with the section's other "global OpenSpec workflows" copy
- **AND** the existing visibility-toggle persistence behavior and documentation links paragraph remain in place

### Requirement: Retired command format preferences are migrated and ignored
The system SHALL ignore any stored command-format preference when generating command text: neither the stored `format` field nor the legacy `aiTool` field SHALL influence command generation. The system SHALL keep stored command visibility preferences, SHALL drop the retired `format` and `aiTool` fields from the stored preferences object on the next preferences write, and SHALL keep command generation working when no format preference exists.

#### Scenario: Stored format value is ignored after upgrade
- **WHEN** localStorage contains a command preferences object whose `format` field is `claude-code`
- **THEN** command generation does not use that stored format
- **AND** the same applies to the other retired `format` values `standard` and `skill`
- **AND** the stored command visibility preferences continue to apply

#### Scenario: Legacy aiTool value is ignored after upgrade
- **WHEN** localStorage contains a legacy `aiTool` value such as `default` or `claude-code` from a previous version
- **THEN** command generation does not use that stored value

#### Scenario: Retired fields are cleaned on next write
- **WHEN** the system writes command preferences after a stored `format` or `aiTool` value was present
- **THEN** the written preferences object no longer contains a `format` or `aiTool` field
- **AND** the command visibility preferences are unchanged

### Requirement: Read-only Tools settings section
The Tools settings section SHALL be read-only. It SHALL explain how OpenSpec installs per-tool commands and skills and that per-repository integrations are added or removed by re-running `openspec init`, SHALL link to the supported-tools documentation and the `openspec init` CLI reference, SHALL show the active repository path with a copyable `openspec init <active-repository-path>` block, SHALL list detected integrations, and SHALL NOT include a command-format selection control.

#### Scenario: Tools section explains integrations without format controls
- **WHEN** the operator opens the Tools section with an active repository
- **THEN** the section explains per-tool installation and `openspec init` re-runs, shows the active repository path and detected integrations
- **AND** no command-format selection control is rendered

### Requirement: Commands settings command groups
The Commands settings category SHALL render `sync` and `update` in the Core Commands group, SHALL NOT render `sync` or `update` in the Expanded Commands group, and SHALL NOT render `onboard` in either group, matching the OpenSpec v1.8 core profile command list. Each listed command SHALL show a one-line localized description sourced from the shared workflow metadata. The section header SHALL include a refresh control that re-runs the availability detection used by the Tools section.

#### Scenario: Commands groups follow the v1.8 core profile list
- **WHEN** the operator opens the Commands section
- **THEN** `sync` and `update` appear only in the Core Commands group and `onboard` appears in neither group
- **AND** each row shows its one-line localized description

### Requirement: Commands settings per-row availability
The Core Commands and Expanded Commands groups SHALL apply the same availability rule, because the OpenSpec `core` profile is a default set and not a guarantee of installation: a command is toggleable only when the CLI-reported `workflows` list includes it. Each row SHALL render a checkbox when the command is present and a circle-off icon in its place when it is absent. The checkbox / circle-off pair SHALL be the single source of per-row availability truth.

#### Scenario: Core and Expanded rows share the availability rule
- **WHEN** a Core Commands row and an Expanded Commands row are both absent from the CLI-reported `workflows` list
- **THEN** both rows render a circle-off icon instead of a checkbox

### Requirement: Commands settings profile command block
The Commands settings category SHALL render, below the command groups and always visible, a single copyable `openspec config profile` command block with an explanatory caption, not an enablement guide triggered by missing Expanded commands. Copying SHALL place the command on the clipboard only, and the section SHALL NOT execute any command from the browser. Existing visibility-toggle persistence, the docs links paragraph, and the header availability/profile indicator SHALL be kept.

#### Scenario: Profile command block is copy-only
- **WHEN** the operator copies the `openspec config profile` block in the Commands section
- **THEN** the command is placed on the clipboard and is not executed from the browser
