## Context

The Validation panel currently centers on running `openspec validate --all --strict --json` for the active project. That works for the first version of validation, but execution knobs such as strict mode, concurrency, and auto-run are persistent preferences rather than per-result content. Keeping those controls in the panel header would make the panel noisy and duplicate information already shown in the result summary list.

This change introduces request-level validation options and frontend preference persistence, then places the operator-facing controls in Settings. The Explorer panel remains a compact operational surface for starting validation, tracking the latest run, and navigating failures.

## Goals / Non-Goals

**Goals:**
- Preserve strict validation as the default command behavior.
- Add configurable validation execution options for strict mode and concurrency.
- Add an auto-run preference that is persisted client-side and never sent to the server.
- Move validation preference controls into the Settings page.
- Keep the Validation Explorer panel focused on Run, last-run metadata, current status, and failed-item navigation.
- Avoid panel header layout shift when the Run button enters loading state.

**Non-Goals:**
- Add target selection for individual specs or changes; validation remains all-item validation.
- Add server-side persistence of UI preferences.
- Add global process queueing or cancellation for validation commands.
- Change how validation failures navigate to existing spec/change tabs.

## Decisions

### 1. Keep strict mode defaulted on

Validation requests with no body or missing options SHALL still execute strict validation. This preserves existing behavior and keeps existing callers compatible.

Alternative considered: default strict mode off once a toggle exists. Rejected because it would silently weaken validation semantics for existing users.

### 2. Treat execution options as normalized request data

The server accepts a defensive JSON body with `strict` and `concurrency`, normalizes it, builds CLI arguments, and records the actual command string in execution error context. Invalid concurrency values are ignored rather than surfaced as request errors so stale or malformed local UI state cannot block validation.

Alternative considered: reject invalid options with 400. Rejected because the options originate from local preferences and omission is a safe fallback.

### 3. Persist validation preferences in the frontend preferences layer

Validation preferences use localStorage, matching existing UI and command preference stores. `autoRun` remains frontend-only; only `strict` and `concurrency` are sent to `/api/validate`.

Alternative considered: store validation preferences server-side per project. Rejected because these are operator UI preferences in a local-first app and should not require registry migration.

### 4. Place validation preferences in Settings, not the Explorer panel

The Settings page receives a validation settings area for strict mode, auto-run, and concurrency. The Validation Explorer panel removes those controls and any duplicated explanatory/summary content from its header.

Alternative considered: keep compact controls in the panel for faster access. Rejected because persistent settings do not need to compete with validation results and navigation in the narrow Explorer Pane.

### 5. Stabilize Validation panel run-row layout

Last-run metadata is rendered on its own line below the Run button. The button can grow when the loading spinner appears without moving adjacent date text horizontally.

Alternative considered: reserve fixed button width. Rejected because a separate metadata line is simpler and scales better with localized strings.

## Risks / Trade-offs

- Settings discoverability → The Validation panel should still expose the effective command preview or concise hint if needed, but not inline preference controls.
- Auto-run surprise → Default remains off, and auto-run only triggers when the panel is opened with an active project and no current result/error for that project.
- Unsupported CLI versions → If `--concurrency` is unsupported by an installed OpenSpec CLI, the command failure is surfaced through existing validation error handling.
