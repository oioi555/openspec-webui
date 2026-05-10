## 1. Investigation

- [x] **1.1** Confirm the Dashboard Tasks summary card currently hardcodes a warning `IconBox` tone while the Validation summary card uses state-driven tone mapping.
- [x] **1.2** Confirm the aggregate task progress source remains `stats.value?.overallTaskProgress` with the existing fallback aggregation logic.

## 2. Shared task-progress semantics

- [x] **2.1** Add a shared task-progress icon-tone helper that maps zero tasks to `muted`, incomplete tasks to `warning`, and complete tasks to `success`.
- [x] **2.2** Keep the helper scoped to icon semantics only so it does not change task counts, percentage math, or card copy.

## 3. Dashboard Tasks card update

- [x] **3.1** Update the Dashboard Tasks summary card to use the shared task-progress icon semantics instead of a hardcoded warning tone.
- [x] **3.2** Preserve the existing percentage text, done/total text, progress bar, layout, and click behavior.

## 4. Verification

- [x] **4.1** Add or update regression coverage for zero-task, incomplete-task, and complete-task icon tones.
- [x] **4.2** Verify the neighboring Validation card and other dashboard summary cards remain visually unchanged.
