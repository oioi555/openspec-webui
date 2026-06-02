## 1. Command Category Update

- [x] 1.1 Move `sync` from the expanded command category to the core command category in the shared command preference/shortcut constants.
- [x] 1.2 Verify the Settings Commands section renders `sync` under Core Commands and excludes it from Expanded Commands.
- [x] 1.3 Confirm existing `sync` visibility preference persistence remains keyed by `sync` and is not reset by the category move.

## 2. Sync Shortcut Visibility and Ordering

- [x] 2.1 Show `sync` for active, unarchived changes with `specDeltaCount > 0`, regardless of task completion status.
- [x] 2.2 Preserve incomplete-change command ordering as earlier-to-later workflow stages, with `sync` after implementation-continuation commands.
- [x] 2.3 Update completed-change command ordering to `verify`, `sync`, `archive` so archive remains the far-right final action.

## 3. Verification

- [x] 3.1 Update or add Settings/command preference tests covering the new `sync` grouping.
- [x] 3.2 Update or add command shortcut tests covering Sync visibility for incomplete changes with spec deltas and completed-change ordering.
- [x] 3.3 Run the relevant frontend test suite and OpenSpec validation for this change.
