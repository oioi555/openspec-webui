## Context

V1 (`add-validation-panel`) adds a manual validation run and a cross-cutting Validation panel in the Explorer Pane. That panel acts as the issue index. V2 adds item-local context inside existing document viewers so operators can keep validation details visible while reading the relevant spec or change.

The user explicitly rejected a bottom details panel for ChangeViewer because change documents use top document tabs such as `proposal.md`, `design.md`, `tasks.md`, and spec deltas. A bottom panel would force the operator to scroll back up to switch tabs. The preferred placement is above the document tabs/content area: compact status always visible, optional details expanded inline, then the existing document tabs/content immediately below.

## Goals / Non-Goals

**Goals:**
- Add a compact, always-visible validation status strip to SpecViewer and ChangeViewer.
- Put the strip above the document tab/content area, not at the bottom.
- Add collapsible Details that show messages for the current spec/change from the latest validation result.
- Preserve the existing document tabs and document reading workflow.
- Support unknown or stale states when no current validation result exists or the latest result does not include the item.

**Non-Goals:**
- No right sidebar in V2.
- No bottom details panel.
- No automatic validation run when a viewer opens.
- No editing/fixing UI inside validation details.
- No Dashboard card; that remains V3.

## Decisions

### 1. Status bar above document tabs/content

**Decision**: Render validation status immediately below the viewer header metadata and above any document tabs or markdown content.

**Rationale**: The status remains visible at the top of the document context, and expanding details does not separate the operator from the document tab controls. This directly addresses the ChangeViewer scrolling concern.

**Alternative considered**: Bottom details panel. Rejected because it makes tab switching and issue comparison awkward in ChangeViewer.

### 2. Shared compact component with item-specific lookup

**Decision**: Use a shared validation status component that receives item type/name and reads or is passed the latest validation result. It derives `passed`, `failed`, `unknown`, or `stale` state for that item.

**Rationale**: SpecViewer and ChangeViewer need the same visual pattern with different item identifiers. A shared component reduces divergence and makes V3/Dashboard links easier to align later.

**Alternative considered**: Duplicate markup in each viewer. Acceptable for a quick implementation, but a shared component is preferred if it does not add complexity.

### 3. Details are collapsible and local to the current item

**Decision**: The status bar SHALL show a compact summary by default and expose a Details toggle when the current item has validation messages. Expanded details SHALL list only messages for the current spec/change.

**Rationale**: The viewer should provide relevant context, not become another global issue index. The global list remains the V1 Validation panel.

**Alternative considered**: Show all validation messages inline. Rejected because it duplicates the Explorer panel and distracts from the current document.

### 4. Do not auto-run validation from viewers

**Decision**: Viewer status reflects the latest validation result from V1 and can link or point back to the Validation panel to refresh. It does not automatically execute validation when a viewer mounts.

**Rationale**: Auto-runs can be expensive and surprising. V1 establishes manual validation as the source of truth.

**Alternative considered**: Run validation when opening a failed item. Rejected for V2 because it risks flicker and makes navigation slower.

## Risks / Trade-offs

- **Stale result ambiguity** → Clearly label no-result or old-result states, including last-run timestamp when available.
- **Visual crowding above document tabs** → Keep the default state one compact row; details are collapsed by default unless opened from a validation failure deep link in a future change.
- **V1 result shape changes during implementation** → Recheck V2 before implementation and align lookup helpers with the final V1 DTO.
- **Spec/change names differ between validation output and UI routes** → Reuse V1 normalized item names and navigation targets.

## Open Questions

- Whether selecting a failed item in the V1 panel should auto-expand Details in the target viewer can be decided during implementation or a later refinement.
- Whether passed items should show an affirmative green bar or a more muted compact indicator should be checked against the final UI density.
