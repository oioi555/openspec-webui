## MODIFIED Requirements

### Requirement: Provide localized application UI
The system SHALL support localized application chrome for the OpenSpec WebUI with `en` as the base locale and `ja` as an additional supported locale. Supplementary descriptions, help text, empty-state explanations, toast feedback, error text, and context-menu labels SHALL resolve from the active locale. Short titles and OpenSpec-derived terms such as `Settings`, `Dashboard`, `Archive`, `Specs`, workflow command names, `Specification`, `Design`, and `Spec Deltas` SHALL remain in English so they continue to match command names and project structure, and the implementation MAY keep those fixed labels outside the translation catalogs. When a message is unavailable in the active locale, the system SHALL fall back to the base locale. The `ja.json` catalog currently contains some entries with untranslated English values (e.g., `"project_selector_no_projects": "No projects added yet."`); these are accepted gaps where the Japanese translation has not yet been provided and the English fallback is displayed.

#### Scenario: Render English application chrome
- **WHEN** the active locale is `en`
- **THEN** settings, navigation, explorer labels, dashboard labels, viewer controls, context menus, empty states, and toast feedback render English copy

#### Scenario: Render Japanese application chrome
- **WHEN** the active locale is `ja`
- **THEN** supplementary descriptions, help text, empty-state explanations, toast feedback, error text, and context-menu labels render Japanese copy
- **AND** short titles and OpenSpec-derived terms remain in English

#### Scenario: Fall back to base locale for a missing translation
- **WHEN** a translated message is unavailable in `ja`
- **THEN** the system renders the `en` message for that key
- **AND** the surrounding UI remains usable

#### Scenario: Untranslated English entries in ja.json
- **WHEN** the active locale is `ja`
- **AND** a `ja.json` entry contains an untranslated English string
- **THEN** the system displays the English string as-is
- **AND** this is an accepted gap pending translation
