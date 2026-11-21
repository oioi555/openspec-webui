# Tasks

## 1. Decouple detection from the official snapshot

- [x] 1.1 Add `openspec-legacy-v1.json` (v1.14.0 `commands` entries, v1.14.0 per-tool skill signatures, plus the retired `amazon-q` record), and make `buildToolSpec()` take commands and retired tools from it and use the union of official and legacy skill folders. Verify that the existing detection tests pass unchanged, and add a test that strips `amazon-q` and all `commands` from a copy of the official data and still gets identical detector signatures, and a test that every v1.14.0 skill signature is still produced after the re-pin.

## 2. Maintenance workflow

- [x] 2.1 Make `update-tool-reference.mjs` pick `docs-lab/reference/supported-tools.md` for `v2.*` tags and `docs/supported-tools.md` for earlier ones. Verify with `scripts/tool-reference-maintenance.test.mjs` cases for both release lines.
- [x] 2.2 Teach the script to build and diff `tool-scope-support.json` from the `skills` version in the tag's `package.json` and OpenSpec's installer aliases. Update SKILL.md. Verify with tests using a captured agent table (universal, linked with `env`, project-only, changed folder).
- [x] 2.3 Run the skill for `v2.1.1` (dry run, then write after review). Verify that the diff removes `amazon-q`, adds the new tools, has no Commands, records `eve` and `promptscript` as project-only, and that `npm test` passes.

## 3. Detection and API

- [x] 3.1 Replace `GLOBAL_SKILL_DIRS` with `tool-scope-support.json` in global detection. Verify with the existing global-detection tests and a data-validation test.
- [x] 3.2 Add `toolNames` and `scopeSupport` to the tool-reference API and the client types and guards. Verify with server integration and `api.test.ts` cases.

## 4. Client

- [x] 4.1 Replace `OPENSPEC_TOOL_NAMES` in `toolChoices.ts` with the served names. Verify that `toolChoices.test.ts` passes with names injected.
- [x] 4.2 In the compatibility reference, show the single "Commands retired in 2.0" note and a scope support column, with messages in 7 locales. Verify with a component test and `npm run typecheck`.

## 5. Verification

- [x] 5.1 Run `npm test`, `npm run typecheck` and `npm run build`, and verify all pass.
- [x] 5.2 In the dev server, open this repository (global), the 2.1.1 fixtures and a 1.x fixture. Verify that the tool list and shortcuts match before the re-pin, and that the reference dialog shows v2.1.1 with scope support.
