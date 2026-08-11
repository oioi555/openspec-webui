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
