# ui-localization Specification

## Purpose
Define localized application chrome behavior for the OpenSpec WebUI, including locale switching, persistence, document semantics, and locale-aware formatting.

## Requirements
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

### Requirement: Switch locale from Settings without losing context
The system SHALL provide a language selection control in the Settings dialog's General section. The control SHALL list `English` and `日本語`, SHALL show the current locale, and SHALL apply the selected locale during the current session without forcing the operator to reopen the current view.

#### Scenario: Show available language options in Settings
- **WHEN** the operator opens the Settings dialog
- **THEN** the General section shows a language selection control
- **AND** the control lists `English` and `日本語`
- **AND** the current locale is selected

#### Scenario: Switch from English to Japanese in Settings
- **WHEN** the active locale is `en`
- **AND** the operator selects `日本語` in the Settings dialog
- **THEN** the visible application chrome updates to Japanese
- **AND** the currently focused tab or overlay remains open

#### Scenario: Switch from Japanese to English in Settings
- **WHEN** the active locale is `ja`
- **AND** the operator selects `English` in the Settings dialog
- **THEN** the visible application chrome updates to English
- **AND** the currently focused tab or overlay remains open

### Requirement: Persist and restore locale preference
The system SHALL persist the selected locale in browser storage under a dedicated application preference key and SHALL restore it on later visits before the main application mounts. When no saved locale exists, the system SHALL prefer the browser language when it matches a supported locale and otherwise fall back to `en`.

#### Scenario: Restore saved locale on reload
- **WHEN** the operator previously selected `ja`
- **AND** the application reloads
- **THEN** the application starts in `ja`
- **AND** the Settings dialog shows `日本語` as the selected language

#### Scenario: Use browser preference on first visit
- **WHEN** no saved locale exists
- **AND** the browser's preferred language resolves to Japanese
- **THEN** the application starts in `ja`

#### Scenario: Fall back to English for unsupported browser languages
- **WHEN** no saved locale exists
- **AND** the browser's preferred language does not resolve to a supported locale
- **THEN** the application starts in `en`

### Requirement: Synchronize document semantics and locale-aware formatting
The system SHALL keep the document `<html>` `lang` attribute synchronized with the active locale and SHALL update the `dir` attribute based on the locale's text direction. Shared date formatting helpers SHALL render date-only values using the active locale while preserving the same calendar day represented by the source timestamp.

#### Scenario: Update html language attributes on locale change
- **WHEN** the operator changes the locale to `ja`
- **THEN** `document.documentElement.lang` becomes `ja`
- **AND** `document.documentElement.dir` reflects the locale text direction

#### Scenario: Format dates in Japanese locale
- **WHEN** the active locale is `ja`
- **AND** a change or spec date is displayed in the UI
- **THEN** the displayed date uses Japanese locale formatting
- **AND** it represents the same calendar day as the source timestamp

#### Scenario: Format dates in English locale
- **WHEN** the active locale is `en`
- **AND** a change or spec date is displayed in the UI
- **THEN** the displayed date uses English locale formatting

### Requirement: Preserve authored OpenSpec content language
The system SHALL localize application chrome only and SHALL NOT machine-translate user-authored OpenSpec markdown bodies.

#### Scenario: Viewer content remains authored language
- **WHEN** the active locale is `ja`
- **AND** the operator opens an English `spec.md` or `proposal.md`
- **THEN** the rendered markdown body remains English
- **AND** only the surrounding viewer chrome is localized
