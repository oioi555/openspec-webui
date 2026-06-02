## Context

The Settings view renders command visibility preferences in Core Commands and Expanded Commands groups using command category constants shared with command shortcut behavior. Upstream OpenSpec documentation now lists `/opsx:sync` in the default `core` profile, so the Settings command grouping needs to reflect that source of truth. The `openspec-sync-specs` skill merges delta specs into main specs without archiving the change, which makes Sync a spec-publishing action rather than an implementation-completion action.

## Goals / Non-Goals

**Goals:**

- Categorize `sync` as a core command in Settings.
- Show Sync for active, unarchived changes that have spec deltas, including incomplete changes.
- Order change-scoped command chips so actions progress left-to-right, with later workflow stages farther right.
- Keep `sync` visibility preference persistence compatible with existing stored command preference data.
- Keep generated command text and change-scoped sync behavior unchanged.

**Non-Goals:**

- Do not add new command formats or rename `/opsx:sync`.
- Do not change archive/sync workflow execution semantics.
- Do not redesign the Settings page layout beyond command grouping.
- Do not add sync-state tracking such as last-synced timestamps in this change.

## Decisions

- Update the shared command category source rather than hard-coding Settings-only ordering. This keeps Settings and command shortcut availability aligned and avoids divergent command lists.
- Preserve `sync` as a change-scoped command for command generation. The upstream category change affects preference grouping and availability, not the optional `[change-name]` argument behavior.
- Leave existing persisted visibility keys unchanged. Moving a command between groups should not reset whether operators have enabled or disabled it.
- Gate Sync on `specDeltaCount > 0` and active/unarchived state instead of task completion. This supports team and parallel-work flows where publishing stable spec deltas early reduces conflicts and regression risk.
- Keep Sync after implementation-continuation commands for incomplete changes, and use `verify → sync → archive` for completed changes. This makes the command row read left-to-right from earlier to later workflow stages, keeping archive as the far-right terminal action.

## Risks / Trade-offs

- Category constants may be used outside Settings; moving `sync` to core can make it available anywhere core commands are enumerated. Mitigation: verify command surfaces still apply workspace/change scope filtering before rendering commands.
- Existing tests may assert the old Expanded Commands grouping. Mitigation: update Settings/command preference coverage to assert `sync` appears under Core Commands and not Expanded Commands.
- Incomplete changes may expose Sync before implementation is ready. Mitigation: only show Sync when spec deltas exist, place it after continuation commands for incomplete changes, and keep archive separate as the final action.
