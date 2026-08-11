## Context

Settings currently mixes reactive Paraglide messages with the English-only `FIXED_LABELS` tree in `uiText.ts`. Most headings, option labels, integration badges, version statuses, documentation labels, and accessibility text therefore ignore locale changes. Workflow metadata stores an English display label, while two functions named `getWorkflowCommandDescription` expose different semantics in `workflowMetadata.ts` and `uiText.ts`.

The seven source catalogs also differ: several Tools and command-shortcut keys exist only in `en` and `ja`. Paraglide compiles missing locale values into base-locale aliases, so runtime tests can pass while untranslated English appears. Existing locale tests validate a small key whitelist after message compilation rather than enforcing source-catalog parity.

## Goals / Non-Goals

**Goals:**

- Make all Settings-facing copy reactive to the active locale.
- Establish one canonical workflow metadata contract for localized names and descriptions.
- Bring all seven source catalogs to exact key parity with non-empty translations.
- Detect catalog omissions and Japanese prose leakage before Paraglide fallback can hide them.
- Preserve English CLI command tokens and explicitly fixed OpenSpec terms.

**Non-Goals:**

- Translate command syntax, file names, paths, or fixed OpenSpec domain terms.
- Redesign the Settings layout or alter command availability and preference behavior.
- Replace Paraglide or change the supported locale list.
- Audit every non-Settings screen beyond shared messages directly required by Settings and command shortcuts.

## Decisions

### 1. Replace Settings `FIXED_LABELS` consumption with generated messages

Add explicit message keys for every translatable Settings label currently read from `FIXED_LABELS` and render them through the existing reactive `t(m.*)` path. This includes sidebar sections, headings, theme options, Tools delivery/status labels, docs labels, Core/Expanded labels, Versions labels and statuses, and copy-button accessibility text. Retain constants only for terms intentionally fixed in English or for non-user-facing identifiers.

Alternative considered: translate the `FIXED_LABELS` object dynamically. Rejected because it would duplicate the catalog system and would not automatically participate in Paraglide generation or locale reactivity.

### 2. Store workflow label and description message identifiers in canonical metadata

Replace the English `label` value in workflow metadata with a label message identifier alongside the existing description message identifier. Expose clearly named metadata accessors for identifiers, and resolve rendered text at the component/UI-text boundary through the reactive localization helper. Remove or rename the duplicate `getWorkflowCommandDescription` helper so no two functions with the same purpose return different data shapes.

Alternative considered: keep English labels and add a translation switch in Settings. Rejected because it creates a second workflow-name map and risks divergence across command surfaces.

### 3. Enforce parity against raw source catalogs before compilation

Extend locale tests to read `frontend/messages/*.json` directly, use the locale list from the inlang configuration, and compare each catalog's sorted key set with `en`. Validate every value as a non-empty string before running assertions against generated message modules. This makes a missing source translation fail even though Paraglide could generate a valid English fallback alias.

Alternative considered: test generated modules only. Rejected because generated fallback is precisely what conceals the defect.

### 4. Use a targeted script-level language leakage guard

For non-`ja` source catalogs, reject hiragana and katakana Unicode ranges. Do not reject Han characters, because Chinese translations legitimately use them. Keep existing command-token assertions and expand them to every message key that embeds supported CLI commands.

Alternative considered: automatically detect whether every translation is linguistically correct. Rejected because heuristic language detection would be unreliable; key parity, non-empty values, targeted script checks, and reviewed translations provide deterministic coverage.

### 5. Add rendered Settings locale tests

Keep pure catalog tests for exhaustive parity, and add component-level coverage that renders representative General, Tools, Commands, and Versions copy under at least `ja` and one non-English, non-Japanese locale. Exercise a runtime locale change while Settings remains mounted and assert that headings, workflow names/descriptions, statuses, and aria text update. Source-regex tests may remain for structural constraints but are not accepted as proof of rendered localization.

Alternative considered: add only more source regex assertions. Rejected because they cannot prove runtime locale reactivity or actual displayed language.

## Risks / Trade-offs

- **[Large number of new message keys and translations]** → Derive the inventory mechanically from Settings usages, enforce exact parity, and review catalogs locale by locale.
- **[Workflow metadata changes affect command chips outside Settings]** → Preserve stable workflow ids and provide compatibility accessors where necessary; run all workflow and command-shortcut tests.
- **[Locale switch tests can be brittle]** → Assert representative semantic text and accessibility output rather than full DOM snapshots.
- **[Fixed English terms may be translated accidentally]** → Maintain explicit command-token assertions and document the fixed-term boundary in message comments/tests.
- **[Paraglide generation changes many generated files]** → Treat source catalogs as the edit surface and regenerate using the existing compile script; do not hand-edit generated modules.

## Migration Plan

1. Inventory every Settings-facing fixed label and add corresponding English base messages.
2. Translate the new and currently missing keys across all six non-English catalogs, preserving required English tokens.
3. Migrate Settings rendering and workflow metadata to reactive message identifiers and remove conflicting helpers.
4. Add raw-catalog parity, non-empty, script-leakage, command-token, rendered Settings, and locale-switch tests.
5. Regenerate Paraglide output and run the full test, typecheck, and production-build suites.
6. Roll back by restoring the prior Settings label accessors and catalogs together; no server or persisted-data migration is required.
