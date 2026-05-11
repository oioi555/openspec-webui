# Tasks for Add explorer list validation icons

## 1. Shared Row and Indicator Plumbing

- [x] **1.1** Update the shared Explorer row/button plumbing so the first line can render an optional trailing accessory at the far right without changing current selection and context-menu behavior.
- [x] **1.2** Rework `StatusIndicator format="minimal"` into a colored icon-only format suitable for compact list-row use.
- [x] **1.3** Verify no existing caller or test depends on the previous `minimal` rendering semantics.

## 2. Active Changes and Specs

- [x] **2.1** Derive per-row validation status for Active Changes from the validation store and show `failed`, `warning`, `info`, and `passed` icons.
- [x] **2.2** Ensure Archive rows never render a trailing validation icon.
- [x] **2.3** Derive per-row validation status for Specs and show only `failed`, `warning`, and `info` icons.
- [x] **2.4** Suppress `not-run`, `stale`, and `unknown` list icons for these Explorer surfaces.

## 3. Search Results

- [x] **3.1** Reuse the existing Search entity-kind resolution to distinguish active changes, archived changes, specs, and non-target results.
- [x] **3.2** Apply the same validation icon visibility rules in Search as in the underlying Explorer lists.
- [x] **3.3** Ensure archived change, project, unknown, and validation-panel rows do not gain the new trailing validation icon treatment.

## 4. Verification

- [x] **4.1** Add or update tests for validation icon visibility rules across Active Changes, Archive, Specs, and Search.
- [x] **4.2** Add or update tests confirming `StatusIndicator format="minimal"` is now icon-only and colored.
- [x] **4.3** Run the project's frontend checks.
- [x] **4.4** Run `openspec validate add-explorer-list-validation-icons --strict`.
