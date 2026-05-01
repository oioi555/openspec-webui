## ADDED Requirements

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
