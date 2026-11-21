# Tasks

## 1. Server

- [x] 1.1 Gate the `openspec config get delivery` read on the CLI major version (skip for ≥2, return `null`), and add `skillsScope` from `openspec/config.yaml` to the availability response. Verify with `openspec-config.test.ts` cases for 1.x/2.x CLIs and present, absent and invalid `skillsScope`. Also adds `copilotCloud` (see design).

## 2. Settings Tools section

- [x] 2.1 Split the Tools list into "This machine" and "This repository" groups with their explanations, the `skillsScope` indicator and per-group empty states. Update 7 locales. Verify with SettingsView tests for global-only, project-only, mixed and empty, and with `npm run typecheck`. (State cases live in `toolsGuidance.test.ts`; `settingsTab.test.ts` checks the wiring.)
- [x] 2.2 Add the state-based command blocks (add a tool with picker, machine or repository by project evidence, keep in repository, move to machine-wide with its blocking reason, init). Verify with SettingsView tests for each predicate, including a project-only tool blocking the move. (State cases live in `toolsGuidance.test.ts`; `settingsTab.test.ts` checks the wiring.)
- [x] 2.3 Show per-row scope support, the 1.x legacy label with the `openspec update` hint, and the multi-target shared label. Verify with SettingsView tests using a command-only integration and the 2.1.1 multi marker. (State cases live in `toolsGuidance.test.ts`; `settingsTab.test.ts` checks the wiring.)

## 3. Documentation links

- [x] 3.1 Re-point every constant in `openspecDocs.ts` to the current `openspec.dev/docs` page, remove the `/opsx` reference link and its use, and align the Add Project init hint. Verify every URL returns HTTP 200 with `curl -sL`, and add a unit test that no URL targets `docs/opsx.md`.

## 4. Verification

- [x] 4.1 Run `npm test`, `npm run typecheck` and `npm run build`, and verify all pass.
- [x] 4.2 In the dev server, open this repository (global), the 2.1.1 global fixture `g1` and the project fixture `p1`. Verify the groups, the offered commands and labels for each, and that every docs link opens.
