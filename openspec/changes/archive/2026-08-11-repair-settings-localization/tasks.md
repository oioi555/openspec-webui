## 1. Source Catalog Completeness

- [x] 1.1 Inventory every translatable Settings-facing `FIXED_LABELS` use and define explicit English base message keys for sidebar sections, headings, options, integration labels, status labels, documentation labels, version labels, captions, and accessibility text.
- [x] 1.2 Add reviewed translations for every new key and the currently missing Tools and command-shortcut keys to `ja`, `de`, `es`, `fr`, `pt-BR`, and `zh-CN`, preserving required English command tokens and fixed OpenSpec terms.
- [x] 1.3 Extend raw-catalog tests to require exact key parity with `en`, non-empty string values, and no hiragana or katakana in non-`ja` catalogs before Paraglide compilation can supply fallbacks.
- [x] 1.4 Expand command-token tests to cover every Settings message containing `openspec init`, `openspec update`, or `openspec config profile` across all supported locales.

## 2. Canonical Workflow Localization

- [x] 2.1 Replace English workflow labels in canonical metadata with label message identifiers while retaining stable workflow ids, scopes, and skill names.
- [x] 2.2 Consolidate workflow label and description lookup into clearly named metadata/message accessors and remove the duplicate `getWorkflowCommandDescription` API with conflicting return semantics.
- [x] 2.3 Update Settings and command-surface callers to resolve workflow labels and descriptions reactively from the active locale without changing command generation behavior.
- [x] 2.4 Add metadata and locale tests proving every surfaced workflow has non-empty label and description messages in all supported locales.

## 3. Complete Settings Localization

- [x] 3.1 Migrate Settings sidebar, General headings, theme options, Explorer labels, and preview-tab accessibility text from fixed English labels to reactive messages.
- [x] 3.2 Migrate Tools and Commands headings, delivery badges, detection/example labels, docs labels, group labels, status text, workflow names, workflow descriptions, and copy accessibility text to reactive messages.
- [x] 3.3 Migrate Versions headings, product labels, current/latest/status labels, update and release guidance, project counts, and copy accessibility text to reactive messages.
- [x] 3.4 Remove or narrow the obsolete Settings portions of `FIXED_LABELS` after all callers migrate, retaining only intentionally fixed English terms or non-user-facing constants.
- [x] 3.5 Add rendered Settings tests under `ja` and at least one non-English, non-Japanese locale, including a mounted runtime locale switch that updates visible labels, workflow copy, statuses, and aria text without reload.
- [x] 3.6 Make workflow labels and descriptions on live command surfaces explicitly depend on the reactive locale helper so an in-place locale change re-renders them.

## 4. Verification

- [x] 4.1 Regenerate Paraglide output and run locale, workflow metadata, Settings, and command-shortcut tests.
- [x] 4.2 Run the complete test suite, TypeScript/Svelte checks, and production build; fix localization regressions without weakening catalog-parity validation.
- [x] 4.3 Run strict OpenSpec validation for `repair-settings-localization` and confirm every localization scenario has automated coverage or an explicit manual check.
