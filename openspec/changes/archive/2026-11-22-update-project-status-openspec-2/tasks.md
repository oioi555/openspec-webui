# Tasks

## 1. Server status

- [x] 1.1 Add a dry-run probe (`openspec update --dry-run --json`, stdout only) with bounded concurrency, and derive per-project `up-to-date` / `update-available` (+`changedFiles`) / `legacy-cleanup` / `unknown`. Gate it on CLI major ≥ 2 and keep the `generatedBy` path otherwise. Verify with `project-version-status.test.ts` using captured JSON for stale project, global-only, legacy, failure and a 1.x CLI.
- [x] 1.2 Derive `machineSkills.status` from the `global-skills` note, and expose the new fields through the API, client types and guards. Verify with server integration and `api.test.ts`, including unknown-status degradation.

## 2. Versions page and guidance

- [x] 2.1 Rework the Versions section: guidance text for machine and repository updates, the machine-wide row, copy actions only for `update-available` and `legacy-cleanup` projects, file counts, and the `--force` cleanup explanation. Update 7 locales. Verify with Versions component tests for each scenario and `npm run typecheck`.
- [x] 2.2 Update the `openspec config profile` caption in the Commands section to the 2.x wording. Verify the en/ja copy.

## 3. Verification

- [x] 3.1 Run `npm test`, `npm run typecheck` and `npm run build`, and verify all pass.
- [x] 3.2 In the dev server, with this repository (global), `p1`, and a stale copy (`p2`) registered, verify the machine row, that only `p2` offers a copy action with its file count, and that refresh recomputes after editing a skill file.
