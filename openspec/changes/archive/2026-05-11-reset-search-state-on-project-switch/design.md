## Context

The current Search implementation splits state across two places:

- the visible query string lives in `appData.svelte.ts`
- the visible results and request lifecycle live in `search.svelte.ts` and `searchController.ts`

The project-switch reinitialization flow already clears project-scoped workspace data, validation state, and tabs. But its search reset only clears the query string. The result list and controller invalidation state survive the switch.

That leaves the Search panel in an internally inconsistent state:

```text
before switch (project A)
├─ query = "foo"
└─ results = A-only hits

after switch (project B)
├─ query = ""
└─ results = still A-only hits
```

If the operator opens one of those stale rows, the viewer resolves it inside project B, which can either error or open a same-named item from the wrong project.

There is a second race: the controller currently invalidates old work only when the query changes. A project switch can therefore leave a pending timer or in-flight response from project A capable of repopulating results after project B is already active.

## Goals / Non-Goals

**Goals:**
- Make Search state fully project-scoped.
- Clear Search query/results immediately when the active project changes.
- Ensure previous-project timers and async responses cannot repopulate the Search panel after a switch.
- Keep the fix small and aligned with the existing project reinitialization flow.

**Non-Goals:**
- No automatic re-run of the previous query in the new project.
- No backend or search-parser changes.
- No redesign of Search UI layout or viewer navigation.
- No broad state-management refactor beyond what is needed for a safe reset boundary.

## Decisions

### 1. Use Plan A: clear both query and results on project change

**Decision**: When the active project changes, the client clears the Search query, visible Search results, loading state, and pending Search work.

**Rationale**: This is the safest behavior and completely removes ambiguity about whether a visible result belongs to the current project.

**Alternative considered**: Keep the query and automatically search again in the new project. Rejected because it adds extra request timing, flicker, and race behavior to a bugfix that should stay narrow.

### 2. Run the reset from the existing project-scoped reinitialization path

**Decision**: The full Search reset should run from the same project-scoped reinitialization path already used for project binding changes, reconnect rebinding, and no-active-project transitions.

**Rationale**: The app already centralizes project-boundary cleanup there. Reusing that boundary avoids scattering special-case reset logic across the selector UI, websocket handlers, and Search panel.

**Alternative considered**: Reset Search directly inside the project selector component. Rejected because project changes also arrive through websocket-driven binding flows and null-project fallbacks, not only through the selector UI.

### 3. Invalidate request lifecycle state as part of reset, not only visible results

**Decision**: The reset must invalidate debounced timers and async responses from the previous project, not just clear the currently rendered result list.

**Rationale**: Clearing visible rows alone is insufficient if a previous-project response can immediately repaint them.

**Alternative considered**: Clear only the rendered result array and rely on the next user input to recover. Rejected because it still allows prior-project async work to repollute the panel.

### 4. Keep the reset boundary explicit and cycle-safe

**Decision**: The implementation should expose a dedicated Search project-reset action (or equivalent coordinator) that can be invoked by project reinitialization without creating fragile circular initialization between app-level state and Search state.

**Rationale**: `search.svelte.ts` already depends on app-level query state. The bugfix should avoid making the dependency graph harder to reason about while still giving project reset a single explicit Search reset hook.

**Alternative considered**: Reach into Search internals from multiple modules or duplicate reset behavior in more than one place. Rejected because it increases drift risk and makes stale-response handling easier to miss.

## Risks / Trade-offs

- **Trade-off:** the previous query is lost on project switch.  
  **Accepted because:** Plan A prioritizes correctness over convenience for this bugfix.
- **Risk:** reset wiring could clear Search too broadly on same-project reconnect paths.  
  **Mitigation:** keep the existing guards that skip project-scoped reinitialization when the active project did not actually change.
- **Risk:** partial reset behavior could leave `loading` or pending timers out of sync with visible rows.  
  **Mitigation:** define project reset in terms of the whole Search lifecycle, not only `results`.

## Migration Plan

- Add the Search spec delta first so the intended behavior is explicit.
- Implement the Search reset + invalidation change in the frontend state layer.
- Add regression coverage for visible-result reset and in-flight response invalidation.
- No data migration is required.

## Open Questions

- None. The product choice is fixed to Plan A for this change.
