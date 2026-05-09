## Context

The UI already has useful primitives (`Badge`, `IconBox`, `ExplorerSection`, shared surfaces, context menus), but the meaning-to-visual mapping is repeated at feature call sites. Specs, active changes, archived changes, projects, validation severities, and validation target states are currently rendered through a mixture of inline icon choices, ad-hoc badge variants, and local helper functions.

The most visible inconsistencies are:

- Search and Validation panels are dedicated Explorer Pane panels but implement their own header and row styling rather than sharing Explorer semantics.
- Search results use a single `change` badge and do not identify archived changes.
- Validation panel failed-item rows and `ValidationViewerStatus.svelte` both repeat severity/status badge logic, resulting in a badge-heavy presentation.
- Dashboard recent activity intentionally mixes active changes, archived changes, and specs, but archived changes are not consistently backgrounded as historical items.
- `TabBar.svelte`, `Dashboard.svelte`, and `ChangeViewer.svelte` duplicate file/entity icon selection.

## Goals / Non-Goals

**Goals:**

- Introduce a small semantic presentation layer for entity kinds, validation severity, and validation status.
- Make Search, Validation, Dashboard, TabBar, ChangeViewer, and `ValidationViewerStatus` consume the same semantic metadata instead of maintaining local mappings.
- Make archived changes visually distinguishable anywhere active and archived changes can appear together.
- Reduce validation badge clutter by using icon/type/severity indicators for classification and reserving badges primarily for status labels and counts.
- Align Search and Validation panels with the Explorer visual language without changing their persistent panel behavior.

**Non-Goals:**

- Rebuild the entire design system or replace shadcn-derived primitives.
- Change search or validation server APIs unless a later implementation finds a small client data enrichment impossible without API help.
- Change validation execution semantics, preference persistence, or tab-opening behavior.
- Change dashboard sorting behavior.

## Decisions

### Decision 1: Centralize semantic metadata before refactoring call sites

Create shared metadata/helpers for:

- Entity kinds: `spec`, `active-change`, `archived-change`, `project`, `unknown`.
- Validation issue severity: `error`, `warning`, `info`.
- Validation target/result states: `not-run`, `running` where applicable, `passed`, `failed`, `warning`, `stale`, `unknown`.

The metadata should include icon, label, icon-box variant/tone, badge variant/tone, and optional muted/background guidance.

Rationale: this keeps each consuming component focused on layout, not semantic interpretation. It also avoids replacing one duplication pattern with several new local components that still disagree.

Alternative considered: only extract Svelte components such as `TypeIndicator` and `SeverityIndicator`. Rejected as incomplete because non-Svelte consumers such as tab icon helpers still need the same metadata.

### Decision 2: Provide thin indicator components over the metadata

Add shared visual components such as:

- `TypeIndicator` for entity classification.
- `SeverityIndicator` for issue severity.
- Optionally `StatusIndicator` or status helper functions for validation target/result states.

The components should support density/format choices (`icon-box`, `badge`, `minimal`, or equivalent) so dashboard cards, explorer rows, tab labels, and inline validation details can share semantics without forcing identical layouts.

Rationale: a dashboard card and a compact row need different density, but they should agree that an archived change uses the archive icon and muted tone.

Alternative considered: one universal `Indicator` component. Rejected for now because entity type, severity, and status have different meanings and accessibility labels.

### Decision 3: Resolve active vs archived change kind at the presentation boundary

Search can continue receiving `type: "change"` results, but the UI should resolve whether the result name belongs to active changes or archived changes before rendering. If the data is already available in client stores, prefer client-side resolution; otherwise enrich the search result model in the smallest possible way.

Rationale: the current search API shape can remain stable while the UI presents the distinction users need.

Alternative considered: split server result types into `active-change` and `archived-change`. This is cleaner long-term but unnecessary if the client already has active/archive lists.

### Decision 4: Treat validation type/severity/status as separate visual roles

Validation UI should avoid using badges for every classification. The intended roles are:

- Type: compact `TypeIndicator` icon boxes where the surrounding context needs file/entity kind distinction.
- Severity/status: compact icon boxes or short text rows, not micro-badges, where sidebar width is constrained.
- Status: validation status helper/indicator or a single status badge when a text label is useful.
- Counts: compact text next to the status/severity row, not an extra colored micro-badge unless the surrounding UI already uses count badges consistently.

`ValidationViewerStatus.svelte` should stop maintaining local `getStatusBadgeVariant`, `getStatusIcon`, `getStatusIconVariant`, and issue severity variant logic when equivalent shared semantics exist.

Rationale: this keeps the validation panel and inline validation viewer visually aligned and reduces the current badge soup.

Alternative considered: keep badges but centralize variant functions. This improves maintenance but does not address the visual clutter the user called out.

Refinement: Explorer/sidebar lists should prefer the same icon-box treatment already used by Dashboard. Rendering icon + label inside badges increases horizontal width and causes names to truncate in the sidebar. Validation failed-item rows should therefore make file identity icon-box first: first line for entity icon box plus item name, second line for the target validation status and issue count. The list and main viewer should use the same target status wording (`Failed`) for failed files; issue severity such as `Error` belongs inside issue details, not the file-row summary. Inline validation status in the main viewer should not repeat target type when the page title already communicates whether the viewer is a spec or change.

### Decision 5: Introduce panel shell/layout unification incrementally

Search and Validation panels should share Explorer-adjacent panel chrome: title row, count/status slot, description/action area, sticky header behavior, body spacing, empty/loading states, and selectable row styling. This can be done with a `PanelShell`/`ExplorerPanelShell` primitive or by extending existing Explorer section primitives where practical.

Rationale: Search and Validation are persistent full panels rather than collapsible sections, so forcing them directly into `ExplorerSection` may overfit. A panel shell keeps the layout common without breaking their dedicated behavior.

Alternative considered: convert Search and Validation directly to `ExplorerSection`. Rejected because their headers contain inputs/actions and must remain visible while results scroll.

## Risks / Trade-offs

- [Risk] Over-abstracting visual components could make simple rows harder to read and maintain. → Mitigation: keep metadata helpers small, make indicator components thin, and migrate call sites incrementally.
- [Risk] Client-side active/archive resolution in search could be wrong if result names are ambiguous or lists are stale. → Mitigation: prefer existing canonical stores and fall back to plain `change` semantics when the state cannot be resolved.
- [Risk] Renaming `IconBox` variants to match `Badge` variants could create churn. → Mitigation: do not require variant renames for this change; semantic metadata can bridge `danger` vs `destructive` naming.
- [Risk] Validation UI could lose textual clarity if icons replace too many labels. → Mitigation: keep accessible labels and show text for status/severity where needed, especially in detail rows.
