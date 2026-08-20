# unify-language-section-style

## Why

The Language section in the Settings view still uses a layout that differs from the other sections (Tools & Integrations, Commands, etc.) after the earlier `unify-settings-section-styles` change: the docs link is a standalone `<a>` in the body, explanatory sentences are laid out as plain paragraphs, and the locale selector occupies its own full-width row. Aligning the Language section with the shared conventions also removes the excessive vertical length caused by verbose explanations.

## What Changes

- Add a docs link to the section header (Info icon + "See the docs:" + multi-language guide `<a>` + ExternalLink icon), matching the Tools / Commands sections
- Convert the WebUI display-language block into a label-plus-control row: h3 heading on the left, locale selector right-aligned. Remove the description `<p>` and the independence Callout
- OpenSpec artifact-language block: add a `?` (help) icon next to the h3 heading and move the existing three explanation sentences (artifact_description / existing_project / structural_keywords) into a tooltip. Remove the body explanation `<p>` elements
- Keep the new-project artifact-language command example (caption + copyable command box) unchanged

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `settings-view`: Changes how the "Settings provides an independent Language section" requirement presents its guidance. Replaces read-through explanation paragraphs and a Callout with a heading-plus-right-aligned-control layout, a header docs link, and an on-demand help tooltip. The guidance content (editing `context` in `openspec/config.yaml`, structural headings staying in English, official documentation link) is preserved, but the always-visible independence Callout is removed; separation of the two concerns is expressed through the sub-block structure and the tooltip

## Impact

- Language section of `frontend/src/lib/components/layout/SettingsView.svelte` (around L443-502)
- Tooltip component (`$lib/components/ui/tooltip`, existing, already used by ActivityBar) and a new import of the lucide `CircleHelp` icon
- i18n: no new labels. Existing labels (`settings_language_artifact_description`, `settings_language_existing_project`, `settings_language_structural_keywords`, `settings_language_docs`, and the docs_intro label) are reused. `settings_language_description` and `settings_language_independence` become unused in the UI
- Test `settingsTab.test.ts`: the `data-settings-section="language"` anchor stays. Any string-match assertions on the Language section structure need to follow the new markup
