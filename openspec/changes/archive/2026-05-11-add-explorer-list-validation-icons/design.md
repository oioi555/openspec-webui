## Context

Explorer list rows already share a common first-line layout through `ExplorerListItemButton`, and validation state already exists in a separate store with shared status semantics. The missing piece is a compact display rule that decides where validation status belongs and where it should be suppressed.

Three constraints shape the design:

- Archived changes are not valid validation targets in OpenSpec, so archive rows should not attempt to show inline validation state.
- Active Changes benefit from showing both problems and healthy state because that list is a primary work queue.
- Specs and mixed Search results should stay readable; showing a pass icon everywhere would add noise.

## Goals / Non-Goals

**Goals:**

- Add a compact validation indicator to Explorer-style list rows without adding badges or extra metadata text.
- Keep the indicator rules consistent across Active Changes, Specs, and Search.
- Exclude Archive and Validation list rows from this new treatment.
- Reuse existing validation semantics and avoid introducing a second parallel status-mapping layer.
- Reuse the dormant `StatusIndicator format="minimal"` path for icon-only compact rendering if that change is safe.

**Non-Goals:**

- Change validation execution, result DTOs, or validation panel behavior.
- Add archive validation support.
- Show `not-run`, `stale`, or `unknown` states in explorer lists.
- Redesign the row metadata line or add textual validation labels beside the icons.

## Decisions

### Decision 1: Scope visibility rules by resolved target kind

Inline Explorer validation icons should follow the target kind, not the current panel.

- **Active change rows** render `failed`, `warning`, `info`, and `passed`.
- **Archived change rows** render no validation icon.
- **Spec rows** render only `failed`, `warning`, and `info`.
- **Search rows** first resolve to `active-change`, `archived-change`, `spec`, `project`, or `unknown`, then reuse the same display rule as that resolved kind.
- **Validation rows** do not render this extra trailing icon because they already display validation status directly.

Rationale: this keeps Search behavior aligned with the source entity while letting each target kind choose its own signal-to-noise threshold.

### Decision 2: Place the indicator at the far right of the first line

The shared Explorer row should render the validation icon as an optional trailing first-line accessory.

```text
[type icon] name ………………………………… [status icon]
           metadata / excerpt line
```

Rationale: the right edge is easiest to scan, keeps the type icon on the left, and avoids mixing validation state into the denser metadata line.

### Decision 3: Reuse `StatusIndicator` minimal as colored icon-only output

`StatusIndicator format="minimal"` is currently unused in the repository, so it should be redefined as a compact colored icon-only format suitable for Explorer rows. The format should still preserve accessible labeling through `aria-label`, `title`, and/or visually hidden text, but it should not render badge chrome or a visible text label by default.

Rationale: this keeps the indicator API small and gives `StatusIndicator` three clear densities:

- `badge`: icon + label + container
- `icon-box`: icon + colored background container
- `minimal`: colored icon only

### Decision 4: Hide ambiguous states in explorer lists

Explorer list indicators should suppress `not-run`, `stale`, and `unknown` everywhere, and Specs should also suppress `passed`.

Rationale: the Explorer should highlight actionable or reassuring states only where they are meaningful. Hidden states are less misleading than speculative icons, especially for Search rows and archive-adjacent contexts.

### Decision 5: Keep derivation near the list-surface boundary

The implementation should derive a displayable trailing validation state near the section/search call sites using the existing validation store and `deriveValidationTargetSummary(...)`, then pass either a concrete status or `null` into the shared row component.

Rationale: shared row components should focus on layout, while each surface applies the visibility rules relevant to its entity kind.

## Risks / Trade-offs

- [Risk] Search results may momentarily classify a change incorrectly if active/archive client state is stale. → Mitigation: use the same entity-kind resolution already used by Search and suppress icons for unresolved/archived cases.
- [Risk] A colored icon-only minimal format could accidentally affect existing UI. → Mitigation: the current repository has no callers of `StatusIndicator format="minimal"`; validate before implementation.
- [Risk] Showing pass icons in Active Changes but not Specs introduces asymmetry. → Mitigation: make the asymmetry explicit in specs and keep the rule tied to the workflow needs of each list.
