## ADDED Requirements

### Requirement: Localize Language guidance and Zed integration copy
The system SHALL localize the independent Language section's navigation label, headings, distinction between WebUI and artifact language, existing-project guidance, new-project command caption, documentation-link text, copy-button accessibility label, and Zed integration labels in every supported locale. Every locale SHALL map its WebUI locale to a non-empty human-readable language value suitable for the `--language` command example. The command tokens `openspec init` and `--language`, the path `openspec/config.yaml`, structural keywords `SHALL` and `MUST`, the target id `zed`, and product name `Zed` SHALL remain stable where referenced.

#### Scenario: Render complete Japanese language guidance
- **WHEN** the active locale is `ja` and the operator opens Language
- **THEN** all explanatory copy, labels, documentation text, and accessibility text render in Japanese
- **AND** the command example retains `openspec init --language` in English
- **AND** uses `Japanese` as its CLI language value

#### Scenario: Render an example for every supported locale
- **WHEN** catalog and language-example mappings are validated
- **THEN** every supported locale has all Language and Zed message keys
- **AND** every supported locale resolves to a non-empty CLI language value

#### Scenario: Switch locale while Language is open
- **WHEN** the operator changes the active WebUI locale while the Language section is visible
- **THEN** the visible guidance and accessibility labels update without a page reload
- **AND** the new-project command example updates to the mapped language value

#### Scenario: Render Zed as a product name
- **WHEN** a detected shared-tree target is identified as `zed`
- **THEN** Settings and command-choice copy render the localized surrounding text
- **AND** retain `Zed` and `/openspec-*` unchanged
