## ADDED Requirements

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
