## Context

The user intentionally simplified section headers elsewhere. The current Validation Explorer panel still has a title-row status badge and a prose description. This consumes sidebar space while hiding the most useful operational signal: how many failed, warning, and informational items exist.

The redesign depends on clarified validation semantics:

- File-level status determines which items appear in the list.
- File-level item status counts (`failed`, `warning`, `info`) provide the compact health summary.
- Those file-level statuses are derived from the highest issue severity present before falling back to the raw validity flag when an item has no issues.
- Settings remain outside the Explorer panel but should be one click away.

## Goals / Non-Goals

**Goals:**

- Keep the header compact and scannable.
- Put the settings affordance in the title row instead of a status badge.
- Make failed / warning / info item-status counts visually prominent using color and compact icons/counts.
- Move explanatory text out of the always-visible header body.
- Show an initial placeholder in the list area with explanation and a prominent first-run action.
- After validation has run, keep the header compact by showing a reload action beside the settings action in the title row.
- Connect compact status count badges to list filtering once a result exists.

**Non-Goals:**

- Implement unrelated filtering controls outside the status badge row.
- Redefine validation status semantics.
- Add validation preference controls directly inside the Explorer panel.
- Change validation execution behavior.

## Decisions

### Decision 1: Title row contains title, settings action, and post-run reload

The title row should show the Validation title and a compact settings button that opens Settings to the Validation section. Once validation has run, a compact reload action should appear beside the settings action in the same title-row action cluster. The title row should not show the validation result status badge.

Rationale: status belongs in the summary/count area, while settings is an action the operator needs from this panel.

### Decision 2: Run explanation becomes native title/accessibility text

The always-visible descriptive paragraph should be removed from the header. Before validation has run, the list area should show a placeholder with explanatory text and a prominent Run Validate button. After validation has run, the compact header reload button should carry a native `title` attribute. Custom tooltip components should not be used for this long explanation because they can render poorly in the constrained sidebar.

Rationale: the prose is useful onboarding once, but it occupies permanent sidebar space.

### Decision 3: Header summary shows failed / warning / info item counts

After a validation result exists, the header should show compact, color-coded counts for file-level item statuses:

- Failed item count in danger tone.
- Warning item count in warning tone.
- Info item count in info/neutral tone.

Counts with zero values may be omitted or rendered muted depending on available space, but non-zero counts must be visually distinguishable.

Rationale: operators need immediate health scanning more than a binary failed badge, and the badges must match the list categories they control.

### Decision 4: Count badges are result-visible multi-select filters

After validation has run, failed/warning/info status badges should render as a compact filter row below the title row. Badges should remain visible as status choices while a result exists, even when a count is zero. They act like checkbox-style multi-select controls: the normal colored state means the status is included in the list, while a muted/greyed state means that status is excluded. Toggling a badge updates the list by hiding or showing items with that file-level status.

Rationale: validation starts from an empty-state prompt, then the reload affordance becomes part of the title-row actions while result filters occupy the compact status row. A badge row is easiest to understand when the count and listed items remain connected.

### Decision 5: Run action is icon-only

The initial Run Validate action in the placeholder should be large and text-labeled. After a result exists, the title-row action should become an icon-only reload button with a native `title` and concise `aria-label`. The panel context already establishes that the compact header action belongs to validation.

Rationale: the sidebar is space constrained and the full text button competes with the status/filter row.

## Risks / Trade-offs

- [Risk] Removing prose may reduce discoverability for first-time users. → Mitigation: keep native title/accessibility text on Run Validate.
- [Risk] Count row could still become crowded on narrow panes. → Mitigation: use compact icon/count indicators and allow the badge row to wrap while preserving all status choices.
- [Risk] Filtering can hide items and confuse the operator. → Mitigation: use checkbox-style multi-select toggling with muted excluded badges.
- [Risk] Settings deep-link behavior may require layout/store changes. → Mitigation: implement a focused helper that opens Settings and selects/scrolls to Validation.
