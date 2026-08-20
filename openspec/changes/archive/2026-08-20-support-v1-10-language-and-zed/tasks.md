## 1. Shared Target Detection

- [x] 1.1 Add `.agents/skills/.openspec-target` resolution for `agents`, `codex`, and `zed`, preserving markerless/invalid fallback and ignoring marker-only directories; verify detector tests cover every valid target, whitespace trimming, missing/invalid/unreadable markers, and absent skills.
- [x] 1.2 Expose additive shared-target metadata through command availability and frontend API types without removing existing evidence fields; verify server/API tests assert Zed and legacy ambiguous responses.

## 2. Zed Integration Behavior

- [x] 2.1 Extend the existing shared-skill candidate resolver with Zed slash, Shared `.agents` slash, Codex-led compatible, and legacy ambiguous mappings; verify command-choice tests cover each marker state and final-command grouping.
- [x] 2.2 Render the resolved Zed/shared target identity in Settings without installed-executable wording; verify Settings component tests distinguish `zed`, `agents`, `codex`, and legacy ambiguous labels.

## 3. Language Settings

- [x] 3.1 Add the official multi-language documentation constant and a complete locale-to-CLI-language mapping; verify unit tests cover all supported locales and the expected command values.
- [x] 3.2 Move the locale selector from General into an independent Language section and add the separate artifact-language explanation, existing-project `context` guidance, official docs link, and bottom new-project copyable command example; verify UI tests cover section navigation, content order, locale updates, and clipboard-only behavior.
- [x] 3.3 Add all Language and Zed message keys to every maintained locale while preserving fixed CLI tokens, paths, product names, and normative keywords; verify localization catalog parity and non-Japanese leakage checks pass.

## 4. Integration Verification

- [x] 4.1 Run `npm test`, `npm run typecheck`, and `npm run build`; verify the full suite passes with markerless repositories and existing locale persistence unchanged.
