## MODIFIED Requirements

### Requirement: Localize project initialization guidance
The system SHALL localize the empty-state onboarding guidance, the add-project dialog hint, the setup links, and the related initialization error text in every supported locale. Command names such as `openspec init` and fixed OpenSpec terms SHALL remain in English so they keep matching command names and project structure. When a translation is unavailable in the active locale, the system SHALL fall back to the base locale.

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

#### Scenario: Fixed OpenSpec terms stay English in init guidance
- **WHEN** initialization guidance, setup links, or initialization error text render in any supported locale
- **THEN** `Settings`, `Dashboard`, `Archive`, `Specs`, `Specification`, `Design`, and `Spec Deltas` remain in English
- **AND** the add-project dialog hint, setup links, and initialization error text are localized

### Requirement: Localize Tools section repository and init-command copy
The system SHALL localize, in every supported locale, the Tools section copy for the active repository and the `openspec init <active-repository-path>` command block: the active-repository label, the block caption, the copy-button aria label, and the no-active-project empty-state message. Command tokens such as `openspec init` and fixed OpenSpec terms SHALL remain in English. When a translation is unavailable in the active locale, the system SHALL fall back to the base locale.

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

#### Scenario: Fixed OpenSpec terms stay English in Tools section copy
- **WHEN** Tools section repository or init-command copy renders in any supported locale
- **THEN** `Settings`, `Dashboard`, `Archive`, `Specs`, `Specification`, `Design`, and `Spec Deltas` remain in English

### Requirement: Localize Commands section per-command descriptions and config profile copy
The system SHALL localize, in every supported locale, one description per workflow command shown in the Commands section, plus the caption and copy-button aria label of the always-visible `openspec config profile` copy block. Command tokens such as `openspec config profile`, `openspec update`, and `openspec init`, and fixed OpenSpec terms, SHALL remain in English in every locale. When a translation is unavailable in the active locale, the system SHALL fall back to the base locale.

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

#### Scenario: Every Commands-section workflow has a description key
- **WHEN** the Commands section renders under any supported locale
- **THEN** one description message key exists for each of `propose`, `explore`, `apply`, `sync`, `archive`, `update`, `new`, `continue`, `ff`, `verify`, and `bulk-archive`
- **AND** `Settings`, `Dashboard`, `Archive`, `Specs`, `Specification`, `Design`, and `Spec Deltas` remain in English

### Requirement: Localize the complete Settings interface with catalog parity
The system SHALL render all user-facing Settings copy (navigation, headings, field, option, status, and integration-delivery labels, documentation-link labels, workflow names and descriptions, captions, warnings, and accessibility labels) in the active supported locale, and SHALL update it without a page reload when the locale changes while Settings is open. CLI command tokens and designated fixed English terms SHALL remain unchanged while surrounding prose is localized.

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
The system SHALL localize, in every supported locale, the Language section's navigation label, headings, WebUI-versus-artifact language distinction, existing-project guidance, new-project command caption, documentation-link text, copy-button accessibility label, and Zed integration labels. Every locale SHALL map to a non-empty human-readable value for the `--language` command example. Fixed command tokens, paths, keywords, target ids, and product names SHALL remain stable where referenced.

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

#### Scenario: Language section fixed tokens stay stable
- **WHEN** Language or Zed copy renders in any supported locale
- **THEN** `openspec init`, `--language`, `openspec/config.yaml`, `SHALL`, `MUST`, the target id `zed`, and the product name `Zed` remain unchanged where referenced

## ADDED Requirements

### Requirement: Keep locale source catalogs in parity
Every supported locale source catalog SHALL contain the same message-key set as the English base catalog, with every value a non-empty string, and this validation SHALL run before generated fallback aliases can conceal missing translations. Non-Japanese locale catalogs SHALL NOT contain Japanese kana in localized prose. Runtime base-locale fallback SHALL remain a defense against malformed or externally incomplete catalogs, but maintained source catalogs SHALL pass parity without relying on it.

#### Scenario: Parity validation runs before fallback aliases
- **WHEN** a maintained locale catalog is missing a key that the English base catalog has
- **THEN** source-catalog validation fails before generated fallback aliases are produced
- **AND** the missing translation is not concealed by runtime fallback

#### Scenario: Runtime fallback stays defensive
- **WHEN** an externally incomplete or malformed catalog is loaded at runtime
- **THEN** the base-locale copy is rendered for the affected keys
- **AND** maintained source catalogs still pass parity without this fallback

### Requirement: Resolve Settings workflow copy through one canonical path
Workflow display names and descriptions shown in Settings SHALL resolve through one canonical metadata-to-message path so the active locale controls both values consistently. The system SHALL NOT maintain a second helper with the same public purpose but different return semantics.

#### Scenario: Name and description follow the same locale
- **WHEN** Settings renders a workflow row
- **THEN** its name and description both resolve through the canonical metadata-to-message path in the active locale

#### Scenario: No duplicate workflow-copy helper
- **WHEN** the workflow-copy helpers are inspected
- **THEN** only one helper serves the purpose of resolving workflow names and descriptions
