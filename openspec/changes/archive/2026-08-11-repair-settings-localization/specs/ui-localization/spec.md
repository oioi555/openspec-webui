## ADDED Requirements

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
