## Why

The Dashboard Tasks summary card currently renders the same warning-colored icon regardless of whether the workspace has no tasks, has unfinished work, or has completed all tracked tasks.

That makes the Tasks card less trustworthy than the neighboring Validation card, which already changes its icon tone based on actual state. A static warning tone also adds unnecessary visual urgency when there are no tasks at all or when all tasks are complete.

## What Changes

- add task-summary icon semantics for three dashboard states: no tasks, incomplete tasks, and complete tasks
- update the Dashboard Tasks summary card to derive its icon tone from overall task progress instead of hardcoding `warning`
- keep the current percentage/count display, progress bar, and click behavior unchanged

## Capabilities

### New Capabilities
- `dashboard-task-summary`: the Dashboard Tasks card reflects overall task progress with state-aware icon tone

### Modified Capabilities
- `shared-ui-parts`: shared task-progress icon semantics define the canonical muted/warning/success mapping for task summary surfaces

## Impact

- Affected frontend areas include `frontend/src/lib/views/Dashboard.svelte` and likely `frontend/src/lib/visualSemantics.ts`
- No backend, CLI, API, or data-model changes are expected
- Regression coverage should verify icon tone for zero-task, incomplete-task, and complete-task dashboard states
