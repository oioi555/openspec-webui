## Context

The Dashboard Tasks summary card already computes and renders aggregate task progress:

- `overallTaskProgress` is sourced from `stats.value?.overallTaskProgress` when available
- otherwise it is derived from active and archived change task totals
- the card shows percentage, done/total counts, and a progress bar

The only state-insensitive part is the icon: `Dashboard.svelte` currently hardcodes the Tasks `IconBox` variant to `warning`.

The neighboring Validation summary card already uses a state-driven icon tone, so the Dashboard currently presents two adjacent summary cards with different visual semantics maturity.

## Decisions

### 1. Use three task-summary visual states

The Tasks summary icon will use three states driven by aggregate task progress:

- `muted` when `total === 0`
- `warning` when `total > 0` and `done < total`
- `success` when `total > 0` and `done === total`

This keeps the behavior aligned with the requested three-way distinction:

```text
overall task progress
        │
        ├─ total = 0 ───────────────▶ muted
        ├─ 0 < done < total ────────▶ warning
        ├─ done = 0, total > 0 ─────▶ warning
        └─ done = total, total > 0 ─▶ success
```

`done = 0` with existing tasks remains part of the incomplete/warning bucket rather than introducing a separate "not started" state. That keeps scope tight and matches the current card, which summarizes completion rather than a richer workflow lifecycle.

### 2. Prefer shared semantics over another Dashboard-only hardcode

The tone mapping should live in a shared helper rather than as an inline conditional in `Dashboard.svelte`.

The most natural home is `frontend/src/lib/visualSemantics.ts`, alongside existing shared entity and validation visual mappings. The helper can return the canonical `IconBoxVariant` for task progress summary surfaces.

This keeps the Tasks card aligned with the project’s existing visual-semantics pattern and prevents future task-summary surfaces from reintroducing ad-hoc mappings.

### 3. Keep card structure and interaction unchanged

This change is visual-semantic only.

The Tasks card will continue to:

- render in the same dashboard summary-card grid position
- display the same percentage and `done/total` text
- render the existing progress bar
- use the same click target and navigation behavior

## Risks and Checks

- ensure zero-task workspaces render a subdued neutral tone rather than attention-grabbing warning
- ensure complete task states render `success` even when progress is sourced from precomputed `stats`
- avoid expanding scope into new labels, badges, or copy changes for the Tasks card
- verify any shared helper uses the same aggregate numbers the card already shows so icon tone cannot drift from displayed progress
