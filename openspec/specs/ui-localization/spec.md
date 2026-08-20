# ui-localization Specification

## Purpose
Localization support for the OpenSpec WebUI interface.

## Requirements

### Requirement: Localize project initialization guidance
The system SHALL localize the empty-state onboarding guidance, the add-project dialog hint, the setup links, and the related initialization error text in every supported locale. Command names such as `openspec init` and fixed OpenSpec terms such as `Settings`, `Dashboard`, `Archive`, `Specs`, `Specification`, `Design`, and `Spec Deltas` SHALL remain in English so they continue to match command names and project structure. When a translation is unavailable in the active locale, the system SHALL fall back to the base locale.

#### Scenario: Render init guidance in Japanese
- **WHEN** the active locale is `ja`
- **THEN** the empty-state onboarding guidance and add-project hint render Japanese copy
- **AND** `openspec init` remains in English

#### Scenario: Render init guidance in Brazilian Portuguese
- **WHEN** the active locale is `pt-BR`
- **THEN** the empty-state onboarding guidance and add-project hint render Brazilian Portuguese copy
- **AND** `openspec init` remains in English

#### Scenario: Fall back to English for missing onboarding copy
- **WHEN** a localization key for the onboarding guidance is missing in the active locale
- **THEN** the base English copy is rendered
- **AND** the surrounding UI remains usable

#### Scenario: Reuse the shared docs intro copy across onboarding and settings
- **WHEN** onboarding or settings surfaces render OpenSpec documentation links
- **THEN** they use the same localized intro copy key for the docs label
- **AND** that copy is available in every supported locale

### Requirement: Localize Tools section repository and init-command copy
The system SHALL localize, in every supported locale, the Tools section copy introduced to identify the active repository and the `openspec init <active-repository-path>` command block: the active-repository label, the init-command block caption, the copy-button aria label, and the empty-state message shown when no project is active. Command tokens such as `openspec init` and fixed OpenSpec terms such as `Settings`, `Dashboard`, `Archive`, `Specs`, `Specification`, `Design`, and `Spec Deltas` SHALL remain in English so they continue to match command names and project structure. When a translation is unavailable in the active locale, the system SHALL fall back to the base locale.

#### Scenario: Tools section copy renders in Japanese with English init token
- **WHEN** the active locale is `ja` and an active project is selected
- **THEN** the active-repository label, init-command block caption, and copy-button aria text render Japanese copy
- **AND** the `openspec init` token remains in English

#### Scenario: Tools section copy renders in Brazilian Portuguese with English init token
- **WHEN** the active locale is `pt-BR` and an active project is selected
- **THEN** the active-repository label, init-command block caption, and copy-button aria text render Brazilian Portuguese copy
- **AND** the `openspec init` token remains in English

#### Scenario: Tools section empty-state copy falls back to English
- **WHEN** the active locale is missing the empty-state message for the Tools section
- **THEN** the base English copy is rendered
- **AND** the surrounding Tools section remains usable

#### Scenario: Tools section command block keeps init token in English across locales
- **WHEN** the Tools section renders the copyable init command block under any non-English active locale
- **THEN** the command token `openspec init` is rendered in English
- **AND** the copied clipboard text contains the English `openspec init` token followed by the active repository path

### Requirement: Localize Commands section per-command descriptions and config profile copy
The system SHALL localize, in every supported locale, the Commands section copy introduced to describe each workflow command and to label the always-visible `openspec config profile` copy block: (a) one description message key per workflow command shown in the Commands section (`propose`, `explore`, `apply`, `sync`, `archive`, `update`, `new`, `continue`, `ff`, `verify`, `bulk-archive`), (b) the caption and copy-button aria label for the `openspec config profile` copy block. Command tokens such as `openspec config profile`, `openspec update`, and `openspec init` SHALL remain in English across every locale so they continue to match command names. Fixed OpenSpec terms such as `Settings`, `Dashboard`, `Archive`, `Specs`, `Specification`, `Design`, and `Spec Deltas` SHALL also remain in English. When a translation is unavailable in the active locale, the system SHALL fall back to the base locale.

#### Scenario: Per-command description renders in Japanese with English command tokens
- **WHEN** the active locale is `ja` and the operator views the Commands section
- **THEN** each command row's one-line description renders Japanese copy
- **AND** any command tokens referenced by the description remain in English

#### Scenario: Per-command description renders in Brazilian Portuguese with English command tokens
- **WHEN** the active locale is `pt-BR` and the operator views the Commands section
- **THEN** each command row's one-line description renders Brazilian Portuguese copy
- **AND** any command tokens referenced by the description remain in English

#### Scenario: Config profile copy block localizes surrounding copy only
- **WHEN** the active locale is non-English and the `openspec config profile` copy block is rendered
- **THEN** the caption and copy-button aria label render in the active locale
- **AND** the command token `openspec config profile` remains in English
- **AND** the copied clipboard text contains the English `openspec config profile` token

#### Scenario: Missing Commands-section copy falls back to English
- **WHEN** the active locale is missing any Commands-section description, caption, or copy-block key
- **THEN** the base English copy is rendered for that key
- **AND** the surrounding Commands section remains usable

#### Scenario: English command token rule covers new Commands-section keys
- **WHEN** any supported locale file is checked for the new Commands-section keys
- **THEN** command tokens (`openspec config profile`, `openspec update`, `openspec init`) inside those key values remain in English
- **AND** only the surrounding prose is translated

### Requirement: Localize the complete Settings interface with catalog parity
The system SHALL render all user-facing Settings navigation labels, section headings, field labels, option labels, status labels, integration-delivery labels, documentation-link labels, workflow names, workflow descriptions, captions, warnings, and accessibility labels in the active supported locale. Changing the active locale while Settings is open SHALL update that copy without requiring a page reload. CLI command tokens and OpenSpec terms explicitly designated as fixed English terms SHALL remain unchanged while their surrounding prose is localized.

Every supported locale source catalog SHALL contain the same message-key set as the English base catalog, and every value SHALL be a non-empty string. Source-catalog validation SHALL run before generated fallback aliases can conceal missing translations. Non-Japanese locale catalogs SHALL NOT contain Japanese kana in localized prose. Runtime base-locale fallback SHALL remain available as a defensive mechanism for malformed or externally incomplete catalogs, but maintained source catalogs SHALL pass parity without relying on it.

Workflow display names and descriptions shown in Settings SHALL resolve through one canonical metadata-to-message path so the active locale controls both values consistently. The system SHALL NOT maintain a second helper with the same public purpose but different return semantics.

#### Scenario: Settings renders complete Japanese copy
- **WHEN** the active locale is `ja` and the operator opens each Settings section
- **THEN** all translatable navigation labels, headings, controls, statuses, workflow names, workflow descriptions, captions, and accessibility labels render Japanese copy
- **AND** required CLI tokens and fixed OpenSpec terms remain in English

#### Scenario: Settings renders complete non-English copy
- **WHEN** the active locale is `de`, `es`, `fr`, `pt-BR`, or `zh-CN` and the operator opens each Settings section
- **THEN** Settings copy renders from that locale's catalog rather than silently using English for maintained keys
- **AND** workflow names and descriptions follow the same active locale

#### Scenario: Locale switching updates an open Settings view
- **WHEN** Settings is open and the operator changes from one supported locale to another
- **THEN** visible Settings labels, workflow names, workflow descriptions, statuses, and accessibility text update to the new locale without reloading the page

#### Scenario: Supported locale catalogs have identical keys
- **WHEN** localization source catalogs are validated
- **THEN** every supported locale has exactly the same message-key set as the English base locale
- **AND** every message value is a non-empty string
- **AND** validation fails before message compilation if parity is broken

#### Scenario: Non-Japanese catalogs reject Japanese prose leakage
- **WHEN** localization source catalogs other than `ja` are validated
- **THEN** validation fails if a value contains Japanese hiragana or katakana
- **AND** Chinese-language Han characters are not rejected solely for also being used in Japanese

#### Scenario: Required command tokens remain stable across locales
- **WHEN** localized Settings copy contains `openspec init`, `openspec update`, or `openspec config profile`
- **THEN** those command tokens remain in English in every supported locale
- **AND** only the surrounding prose is translated

#### Scenario: Workflow copy has one canonical resolution path
- **WHEN** Settings renders a workflow row under any supported locale
- **THEN** the workflow name and description are resolved from canonical workflow metadata message identifiers
- **AND** no duplicate description API with conflicting message-id versus rendered-text semantics is used

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
