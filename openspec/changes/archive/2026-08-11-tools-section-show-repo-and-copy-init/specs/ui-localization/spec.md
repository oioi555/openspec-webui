## ADDED Requirements

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
