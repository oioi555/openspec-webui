## 1. Validation Command Options

- [x] 1.1 Add server-side validation option normalization for strict mode and optional concurrency.
- [x] 1.2 Build `openspec validate --all [--strict] [--concurrency <n>] --json` arguments from normalized options.
- [x] 1.3 Keep empty validation requests backward compatible with strict mode enabled.
- [x] 1.4 Record the actual attempted validation command in structured command-failure context.
- [x] 1.5 Add server tests for default strict mode, strict disabled, valid concurrency, and invalid concurrency fallback.

## 2. Validation Preferences State

- [x] 2.1 Add browser-local validation preference persistence for strict mode, concurrency, and auto-run.
- [x] 2.2 Ensure validation API requests send only strict mode and concurrency, not auto-run.
- [x] 2.3 Wire validation runs to use the current persisted validation execution preferences.
- [x] 2.4 Add tests for validation preference defaults, normalization, and request option conversion.

## 3. Settings UI

- [x] 3.1 Add a Validation section/category to the Settings page navigation.
- [x] 3.2 Move strict mode, auto-run, and concurrency controls from the Validation Explorer panel into Settings.
- [x] 3.3 Show clear explanatory copy for each validation preference in Settings.
- [x] 3.4 Keep validation preference changes persisted and applied to future validation runs.

## 4. Validation Panel Diet

- [x] 4.1 Remove persistent preference controls from the Validation Explorer panel header.
- [x] 4.2 Remove duplicated result summary/counts from the panel header when the list summary already presents them.
- [x] 4.3 Place last-run metadata on its own line below the Run button to avoid button-loading layout shift.
- [x] 4.4 Keep the panel focused on Run, current loading/error state, result summary, and failed-item navigation.

## 5. Auto-run Behavior

- [x] 5.1 Trigger auto-run when the Validation panel opens for an active project with no current result or error.
- [x] 5.2 Prevent repeated reactive renders from starting duplicate auto-run requests.
- [x] 5.3 Allow auto-run to trigger again after active project changes reset validation state.

## 6. Localization and Verification

- [x] 6.1 Add localization keys for validation strict mode, auto-run, and concurrency controls.
- [x] 6.2 Update Settings and Validation panel tests for the final control placement and lean header behavior.
- [x] 6.3 Run the full test suite.
- [x] 6.4 Run typecheck and Svelte diagnostics.
