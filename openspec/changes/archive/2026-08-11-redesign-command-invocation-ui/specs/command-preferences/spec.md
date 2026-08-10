## MODIFIED Requirements

### Requirement: Two-column settings layout
The settings dialog SHALL use a two-column layout with a left sidebar listing setting categories (General, Tools, Commands, Versions) and a right content area showing the selected category's settings. Selecting a category in the sidebar SHALL update the right content area without closing the dialog. The General category SHALL include both theme settings and preview-tab behavior settings. The Versions category SHALL show version and update information for OpenSpec WebUI and OpenSpec CLI. The Tools and Commands sections SHALL reuse shared OpenSpec documentation URL constants for their documentation links so those URLs remain consistent with other frontend surfaces. The Tools section SHALL be read-only: it SHALL explain how OpenSpec installs per-tool commands and skills, SHALL link to the official supported-tools documentation, SHALL explain that per-repository integrations are added or removed by re-running `openspec init`, SHALL list the integrations detected for the active repository, and SHALL NOT include any command-format selection control. The Commands category SHALL render `sync` and `update` in the Core Commands group, SHALL NOT render `sync` or `update` in the Expanded Commands group, and SHALL NOT render `onboard` in either group, matching the OpenSpec v1.8 core profile command list.

#### Scenario: Reuse shared OpenSpec docs links in Settings
- **WHEN** the Tools or Commands section renders OpenSpec documentation links in Settings
- **THEN** those links reuse the shared OpenSpec docs URL constants
- **AND** the Tools section links to the OpenSpec supported tools docs
- **AND** the Commands section links to the OpenSpec commands and workflows docs

#### Scenario: Tools section is read-only with no format selection
- **WHEN** the operator opens the Tools section in Settings
- **THEN** no Standard / Claude Code / Skill command-format selection control is rendered
- **AND** the section shows read-only integration information including a supported-tools documentation link and `openspec init` guidance

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

## ADDED Requirements

### Requirement: Retired command format preferences are migrated and ignored
The system SHALL ignore any stored command-format preference when generating command text. The stored `format` field (with retired values `standard`, `claude-code`, or `skill`) and the legacy `aiTool` field (with retired values such as `default` or `claude-code`) SHALL NOT influence command generation. The system SHALL preserve the stored command visibility preferences alongside the retired fields, SHALL remove the retired `format` and `aiTool` fields from the stored preferences object on the next preferences write, and SHALL keep command generation fully functional when no format preference exists.

#### Scenario: Stored format value is ignored after upgrade
- **WHEN** localStorage contains a command preferences object whose `format` field is `claude-code`
- **THEN** command generation does not use that stored format
- **AND** the stored command visibility preferences continue to apply

#### Scenario: Legacy aiTool value is ignored after upgrade
- **WHEN** localStorage contains a legacy `aiTool` value such as `default` from a previous version
- **THEN** command generation does not use that stored value

#### Scenario: Retired fields are cleaned on next write
- **WHEN** the system writes command preferences after a stored `format` or `aiTool` value was present
- **THEN** the written preferences object no longer contains a `format` or `aiTool` field
- **AND** the command visibility preferences are unchanged
