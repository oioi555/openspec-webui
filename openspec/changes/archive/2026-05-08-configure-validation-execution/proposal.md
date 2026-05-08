## Why

Validation execution currently has no dedicated preferences surface: the command behavior is fixed, and any run controls compete for space in the already dense Explorer panel header. Operators need persistent validation execution preferences, but those preferences belong in Settings rather than crowding the panel that should focus on status and failures.

## What Changes

- Make validation execution configurable while preserving the current strict-by-default behavior.
- Allow operators to omit `--strict`, set `--concurrency <n>`, and enable/disable automatic validation runs.
- Persist validation execution preferences in the UI settings/preferences layer.
- Move validation preference controls to the Settings page instead of the Validation Explorer panel.
- Keep the Validation Explorer panel focused on the primary run action, status, last-run metadata, and failed-item navigation.
- Keep validation result summary rendering in the result list area instead of duplicating the same summary in the header.
- Stabilize the run-control layout by placing last-run metadata on its own line, avoiding horizontal shift when the running spinner appears.

## Capabilities

### New Capabilities
- `settings-view`: Settings as a main-tab page expands with validation execution preferences.

### Modified Capabilities
- `validation`: Validation execution semantics become configurable while retaining current defaults.

## Impact

- Affects the validation API request body and server-side command argument construction.
- Affects frontend validation state, preference persistence, and validation panel rendering.
- Affects Settings UI structure and localization strings.
- Adds tests for validation option normalization, command generation, preference persistence, and API behavior.
