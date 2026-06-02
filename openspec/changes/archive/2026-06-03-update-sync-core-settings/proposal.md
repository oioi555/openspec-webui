## Why

OpenSpec now treats `/opsx:sync` as part of the default `core` command profile. The WebUI should match the upstream command reference and expose Sync as a spec-publishing action that can be useful before implementation is fully complete in team or parallel-work scenarios.

## What Changes

- Move `sync` from the Expanded Commands group to the Core Commands group in the Settings commands section.
- Show the change-scoped Sync command for active changes with spec deltas, even when implementation tasks are not complete.
- Order change-scoped command chips left-to-right by workflow stage so later-stage actions appear farther right; completed changes use `verify → sync → archive`.
- Keep existing command preference persistence and visibility toggles intact while reflecting the new upstream command category.
- Preserve existing command text generation behavior for `/opsx:sync [change-name]`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `command-preferences`: Settings command categorization now treats `sync` as a core command.
- `command-shortcuts`: Sync visibility and command chip ordering now reflect Sync as a core spec-publishing workflow.

## Impact

- Affected code: command preference constants/types, command shortcut selection/order logic, and Settings commands section rendering.
- Affected UI: Settings → Commands → Core Commands / Expanded Commands grouping; Dashboard and ChangeViewer command chip visibility/order.
- No API or dependency changes.
