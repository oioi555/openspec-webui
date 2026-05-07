## Context

The current search flow is optimized around a dialog/overlay: the Activity Bar Search icon opens a transient surface, results are selected there, and the search state is cleared as navigation occurs. That makes it hard to inspect many matches because the result list disappears while the operator previews documents in the Main Viewer.

The Explorer pane already provides the persistent navigation model for specs, changes, and archives, and the Main Viewer already supports open-or-focus tab behavior. This change reuses the pane shell while switching Search into its own Explorer panel so results remain persistent without being mixed into the Active Changes/Archive/Specs section group.

## Goals / Non-Goals

**Goals:**
- Add a persistent Search panel to the Explorer pane with a prominent fixed header, localized explanatory text, input, status/empty copy, and results list.
- Keep search results visible while selecting results opens or focuses Main Viewer tabs.
- Route Activity Bar search, context menu search actions, and `Spec.md` keyword search into the same Explorer search state.
- Preserve debounced querying, short-query suppression, stale response handling, and supported result sources.

**Non-Goals:**
- Add new server-side search sources or ranking semantics.
- Introduce a global full-text index or external search dependency.
- Redesign unrelated Explorer sections or Main Viewer tab behavior.

## Decisions

1. **Use shared frontend search state instead of local dialog state.**
   - Rationale: all entry points need to populate the same query/results and keep them visible across tab switches.
   - Alternative considered: keep the dialog and mirror results into Explorer. This creates duplicate state and risks inconsistent results.

2. **Render search results as a standalone Explorer panel.**
   - Rationale: search is a separate Activity Bar destination. Switching to Search should replace the Active Changes/Archive/Specs group so the operator has a focused result-browsing panel rather than an additional collapsible group.
   - Alternative considered: render Search as a fourth Explorer section. This kept results persistent, but it mixed search into unrelated navigation groups and made the search input scroll away.

3. **Keep the search header and input fixed while results scroll.**
   - Rationale: operators need to see and edit the current keyword while browsing many results.
   - Alternative considered: place the input in the same scroll area as results. This preserves simpler markup but loses query visibility on long result lists.

4. **Selecting a result opens/focuses tabs without clearing search state.**
   - Rationale: the core workflow is reviewing several results in sequence. Clearing state would preserve the current dialog semantics but fail the new preview workflow.
   - Alternative considered: clear only when Activity Bar focus changes. That is surprising because pane state would disappear for reasons unrelated to search input.

5. **Keep existing search API contract.**
   - Rationale: this is primarily an interaction and layout change; backend search behavior remains sufficient.
   - Alternative considered: add API metadata for exact hit locations. Useful later, but not necessary for the requested result list and tab-switching behavior.

## Risks / Trade-offs

- Search state may now persist longer than users expect → provide a clear action and empty/description copy so the panel communicates current state.
- Explorer pane can become visually dense → switch to a dedicated Search panel rather than rendering Search alongside the existing section group.
- Multiple search entry points can diverge → centralize query submission/focus in the shared search state and reuse one selection handler.
- Programmatic focus/scroll could be disruptive → expand/focus the Search section when search is initiated, but preserve manual section behavior otherwise.
