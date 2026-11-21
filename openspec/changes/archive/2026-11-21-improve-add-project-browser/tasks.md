# Tasks

## 1. Directory list behavior

- [x] 1.1 In `AddProjectDialog.svelte`, derive the visible list (OpenSpec-first stable order, case-insensitive name filter, limit 200) and reset the filter and limit in `loadBrowse()`. Verify with `AddProjectDialog.test.ts` cases for ordering, filtering without a second `browseDirectory` call, the 200-entry cap with the reveal control, and the reset on navigation.
- [x] 1.2 Add the filter input, the empty-match state with a clear button, the "show all N" control, and Enter-to-open for a single match. Add the messages in all 7 locales. Verify with `npm run typecheck` and a test for the empty-match state.

## 2. Verification

- [x] 2.1 Run `npm test`, `npm run typecheck` and `npm run build`, and verify all pass.
- [x] 2.2 Open the dialog in the dev server and browse `/tmp`. Verify that navigation feels immediate, that typing a few characters finds the target folder, and that "show all" reveals the remaining entries.
