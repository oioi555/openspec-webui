## MODIFIED Requirements

### Requirement: Settings provides an independent Language section
The Settings view SHALL expose Language as an independent section in its section navigation rather than placing the WebUI locale control inside General. The Language section SHALL present the two language concerns as separate labeled sub-blocks: a WebUI display-language block and an OpenSpec artifact-language block. The WebUI display-language block SHALL render as a labeled row with the locale selector aligned to the right, consistent with the label-plus-control layout used by other settings sections. The section SHALL NOT present the two settings as synchronized.

The artifact-language block SHALL show a one-line body description stating that artifact language is configured separately in each OpenSpec project's context, and SHALL provide a help affordance attached to the artifact-language block heading. Activating the help affordance SHALL reveal guidance that directs existing projects to edit `context` in `openspec/config.yaml` and states that OpenSpec structural headings and `SHALL` / `MUST` keywords remain in English. The Language section header SHALL link to the official OpenSpec multi-language documentation through a shared documentation URL, following the docs-link presentation used by the other settings sections. A copyable `openspec init --language "<language>"` command example for new projects SHALL appear below the artifact-language heading, use the human-readable language corresponding to the active WebUI locale as a convenient example, and SHALL be labeled so it is not presented as an update command for the active project. Copying SHALL place the command on the clipboard only and SHALL NOT execute it.

#### Scenario: Navigate directly to Language
- **WHEN** the operator selects Language in the Settings section navigation
- **THEN** the independent Language section becomes the visible or scroll-targeted section
- **AND** the locale selector is no longer presented inside General

#### Scenario: Distinguish the two language concerns
- **WHEN** the operator views the Language section
- **THEN** the section presents a WebUI display-language labeled row with the locale selector right-aligned
- **AND** presents the OpenSpec artifact-language concern as a separately labeled block
- **AND** does not imply that the two settings are synchronized

#### Scenario: Guide an existing project
- **WHEN** the operator views the artifact-language block and activates the help affordance on its heading
- **THEN** the block's visible description states that artifact language is configured per-project in OpenSpec context
- **AND** the revealed guidance directs existing projects to edit `context` in `openspec/config.yaml`
- **AND** states that structural headings and `SHALL` / `MUST` remain in English

#### Scenario: Link the official multi-language documentation from the header
- **WHEN** the operator views the Language section header
- **THEN** the header presents a documentation link to the official OpenSpec multi-language documentation
- **AND** the link presentation matches the docs-link pattern used by the other settings sections

#### Scenario: Show the new-project command below the guidance
- **WHEN** the active WebUI locale is Japanese
- **THEN** the bottom command example is labeled for new-project initialization
- **AND** contains `openspec init --language "Japanese"`

#### Scenario: Copy without mutating project configuration
- **WHEN** the operator copies the artifact-language command example
- **THEN** the example command is placed on the clipboard
- **AND** the browser does not execute the command or modify `openspec/config.yaml`

#### Scenario: Changing WebUI locale updates only the example
- **WHEN** the operator changes the WebUI display language while Settings is open
- **THEN** the Settings interface and the convenience language value in the example update to the selected locale
- **AND** no OpenSpec project configuration is changed
