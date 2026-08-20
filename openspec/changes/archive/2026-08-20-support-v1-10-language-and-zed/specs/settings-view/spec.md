## ADDED Requirements

### Requirement: Settings provides an independent Language section
The Settings view SHALL expose Language as an independent section in its section navigation rather than placing the WebUI locale control inside General. The Language section SHALL contain the existing WebUI display-language selector and a separate read-only explanation of OpenSpec artifact language. It SHALL clearly state that changing the WebUI display language does not edit the active project's OpenSpec configuration or determine the language of generated artifacts.

The artifact-language guidance SHALL link to the official OpenSpec multi-language documentation through a shared documentation URL, SHALL explain that an existing project configures artifact language by editing `context` in `openspec/config.yaml`, and SHALL state that OpenSpec structural headings and `SHALL` / `MUST` keywords remain in English. A copyable `openspec init --language "<language>"` command example for new projects SHALL appear below the explanatory guidance, use the human-readable language corresponding to the active WebUI locale as a convenient example, and SHALL be labeled so it is not presented as an update command for the active project. Copying SHALL place the command on the clipboard only and SHALL NOT execute it.

#### Scenario: Navigate directly to Language
- **WHEN** the operator selects Language in the Settings section navigation
- **THEN** the independent Language section becomes the visible or scroll-targeted section
- **AND** the locale selector is no longer presented inside General

#### Scenario: Distinguish the two language concerns
- **WHEN** the operator views the Language section
- **THEN** the section identifies the selector as controlling WebUI display language
- **AND** separately explains how OpenSpec artifact language is configured
- **AND** does not imply that the two settings are synchronized

#### Scenario: Guide an existing project
- **WHEN** the operator reads the OpenSpec artifact-language guidance
- **THEN** the section directs existing projects to edit `context` in `openspec/config.yaml`
- **AND** explains that structural headings and `SHALL` / `MUST` remain in English
- **AND** links to the official multi-language documentation

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
