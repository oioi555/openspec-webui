## MODIFIED Requirements

### Requirement: Settings view includes validation execution preferences
The Settings view SHALL render as a main-tab page in the Main Viewer and include a Validation section with execution preferences for strict mode, optional concurrency, and automatic runs. The Validation section SHALL participate in the existing Settings section navigation without closing or replacing the Settings tab. Other UI surfaces, including the Validation Explorer panel, SHALL be able to open Settings directly to the Validation section.

#### Scenario: Configure validation preferences from Settings
- **WHEN** the operator opens the Validation section in Settings
- **THEN** the settings content includes controls for strict validation, auto-run, and concurrency
- **AND** changing those controls updates the persisted validation preferences used by future validation runs

#### Scenario: Validation Explorer panel does not own preference controls
- **WHEN** the operator opens the Validation panel in the Explorer Pane
- **THEN** persistent validation preference controls are not rendered in the Explorer panel header
- **AND** those preferences remain configurable from Settings

#### Scenario: Navigate to Validation within Settings
- **WHEN** the operator selects Validation in the Settings section navigation
- **THEN** the visible or scroll-targeted settings content updates to the Validation section
- **AND** the Settings tab is not closed or replaced

#### Scenario: Open Settings directly to Validation section
- **WHEN** another UI surface requests Settings with the Validation section selected
- **THEN** the Settings tab opens or focuses in the Main Viewer
- **AND** the Validation settings section is selected or scrolled into view

### Requirement: Settings provides an independent Language section
The Settings view SHALL expose Language as an independent section in its section navigation rather than placing the WebUI locale control inside General. The section SHALL present a WebUI display-language block and an OpenSpec artifact-language block as separate labeled sub-blocks, and SHALL NOT present the two settings as synchronized. The display-language block SHALL be a labeled row with the locale selector right-aligned, like the label-plus-control layout of other sections.

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

## ADDED Requirements

### Requirement: Language section guides per-project artifact language
The artifact-language block SHALL show a one-line description that artifact language is configured separately in each OpenSpec project's context, plus a help affordance on its heading that SHALL direct existing projects to edit `context` in `openspec/config.yaml` and SHALL state that OpenSpec structural headings and `SHALL` / `MUST` keywords remain in English. The Language section header SHALL link to the official OpenSpec multi-language documentation through a shared documentation URL.

#### Scenario: Help affordance reveals per-project guidance
- **WHEN** the operator activates the help affordance on the artifact-language block heading
- **THEN** guidance directs existing projects to edit `context` in `openspec/config.yaml`
- **AND** states that OpenSpec structural headings and `SHALL` / `MUST` keywords remain in English

#### Scenario: Header docs link uses the shared URL
- **WHEN** the operator views the Language section header
- **THEN** the official OpenSpec multi-language documentation link uses the shared documentation URL
- **AND** follows the docs-link presentation used by the other settings sections

### Requirement: Language section offers a copy-only new-project init command
The artifact-language block SHALL show a copyable `openspec init --language "<language>"` command example for new projects below its heading. The example SHALL use the human-readable language of the active WebUI locale and SHALL be labeled so it is not presented as an update command for the active project. Copying SHALL place the command on the clipboard only and SHALL NOT execute it.

#### Scenario: Example follows the active WebUI locale
- **WHEN** the active WebUI locale is English
- **THEN** the example below the artifact-language heading contains `openspec init --language "English"`
- **AND** its label marks it as a new-project command, not an update command for the active project

#### Scenario: Copy does not execute the command
- **WHEN** the operator copies the command example
- **THEN** the command is placed on the clipboard
- **AND** the command is not executed
