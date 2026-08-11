## Why

Settings mixes localized messages with English-only `FIXED_LABELS`, while several Tools and shortcut keys exist only in English and Japanese. Locale fallback currently hides missing-key defects, so users can see untranslated labels or inconsistent language after switching locale.

## What Changes

- Replace Settings-facing fixed English labels with reactive message-based localization across General, Tools, Commands, and Versions.
- Localize workflow display names and consolidate duplicated workflow-description lookup paths so labels and descriptions follow the active locale consistently.
- Add the missing Settings Tools and command-shortcut messages to every supported locale.
- Require every supported locale JSON file to contain the same non-empty message-key set as the English base locale.
- Add regression checks that prevent Japanese text from leaking into non-Japanese locales while preserving required English CLI tokens and OpenSpec terms.
- Strengthen Settings tests to verify rendered output and runtime locale changes instead of relying only on source-text assertions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-localization`: Extend localization coverage to the complete Settings interface and enforce message-key parity and locale-safe rendered output for every supported locale.

## Impact

- `SettingsView.svelte`, workflow metadata, and shared UI text helpers.
- All seven locale message catalogs and generated Paraglide message modules.
- Locale, workflow metadata, and Settings component tests.
- No server API or persistence behavior changes.
