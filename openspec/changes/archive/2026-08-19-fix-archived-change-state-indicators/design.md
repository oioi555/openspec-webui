## Context

The file watcher refreshes both active and archived Change summaries after an archive operation. `ChangeViewer` then reloads the original route through `parseChangeByName`, whose archive fallback can resolve the original name to a date-prefixed archive directory. The open tab, however, keeps its original `name`, `id`, and `path`, while `TabBar` and `ActivityBar` currently require exact equality with the archive summary name.

## Goals / Non-Goals

**Goals:**

- Give tab and Activity Bar state a single definition of whether an original Change name corresponds to an archived summary name.
- Preserve reactive updates when refreshed archive summaries arrive.
- Cover exact archived names and original names whose archive entry gained one leading date prefix.

**Non-Goals:**

- Renaming or replacing an open tab after archive.
- Changing browser history, tab persistence, server routes, or parser archive lookup behavior.
- General fuzzy matching between unrelated Change names.

## Decisions

### Use a shared directional archived-name matcher

Add a small frontend utility that reports a match when the names are exactly equal or when removing one valid `YYYY-MM-DD-` prefix from the archived candidate yields the open Change name. Both `TabBar` and `ActivityBar` will use this helper against refreshed archived summaries.

The comparison is directional: only the known archived candidate is normalized. This preserves support for an original Change name that itself begins with a date while avoiding broad normalization of arbitrary active names.

Alternative considered: compare `formatChangeName` results for both values. This is less precise because it removes meaningful date-like prefixes from the open Change name as well.

### Keep the existing tab identity and route

The tab will derive its visual state from archive summaries without mutating its `id`, `name`, or `path`. The existing detail endpoint already resolves the original name after archive, so changing tab identity would require viewer-state migration and browser-history replacement without improving the reported behavior.

Alternative considered: replace the open tab with a new date-prefixed archived tab. This is more invasive and risks losing per-tab viewer state.

### Verify state resolution independently of archive I/O

Add focused tests for exact names, date-prefixed archived names, non-matches, and date-like original names. Add component/controller-level regression coverage demonstrating that refreshed archive names select archived tab semantics and the Archive Activity Bar section.

## Risks / Trade-offs

- [Multiple archived entries share the same original name] → The UI only needs a boolean archived-state result, so any corresponding archived entry is sufficient; this change does not alter which archive the detail parser loads.
- [Archive naming conventions change] → Restrict matching to the documented `YYYY-MM-DD-` convention and retain exact matching as the primary path.
- [Hidden reactivity through helper calls regresses] → Ensure archive summary state participates explicitly in derived UI state and cover the post-refresh transition in regression tests.
