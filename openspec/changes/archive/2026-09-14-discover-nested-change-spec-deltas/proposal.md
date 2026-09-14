## Why

OpenSpec v1.8 allowed capability specs to live in nested trees, and the WebUI already discovers `openspec/specs/**/spec.md`. Change spec deltas still assume a flat `changes/<name>/specs/<capability>/spec.md` layout, so nested deltas never appear in Active Changes, Archive, Dashboard counts, ChangeViewer Spec Deltas, `sync` availability, or search. Operators who follow the CLI's nested capability paths therefore see a change that looks like it has no deltas.

## What Changes

- Discover change spec deltas recursively under `changes/<name>/specs/**/spec.md` at any depth, using the same capability identity rules as main specs: a directory with a direct `spec.md` is a delta; an empty parent directory is not.
- Identify each nested delta by its relative capability path (`network/auth`), not only the immediate directory name.
- Include nested deltas in `specDeltas`, Explorer/Dashboard delta counts, ChangeViewer Spec Deltas, and change search hits, while still excluding them from Other Files and regular file groups.
- Keep existing top-level deltas working unchanged.

## Capabilities

### New Capabilities

- None. Nested delta discovery belongs to the existing change/spec browsing and search surfaces.

### Modified Capabilities

- `spec-browsing`: Recursively discover nested change spec deltas, skip empty parent directories, omit missing retired delta files without error, and count/display those deltas on Active Changes, Archive, Dashboard, and ChangeViewer using the relative capability path.
- `search`: Search nested change spec delta markdown and capability-path metadata the same way top-level deltas are searched, and route hits to the matching nested capability in ChangeViewer.

## Impact

- `src/parser/changes.ts` — Replace the one-level `parseSpecDeltas` walk with recursive discovery aligned to `src/parser/specs.ts`.
- `src/parser/changes.test.ts` and `src/parser/index.test.ts` — Cover nested delta discovery, empty-parent skipping, mixed flat/nested trees, lastModified, Other Files exclusion, and search routing for nested capability paths.
- Downstream consumers (`specDeltaCount`, ChangeViewer Spec Deltas, `sync` chips, search `matchLocation.specDeltaCapability`) keep their current contracts; they start receiving nested entries once parsing is recursive.
- No API shape, type, or frontend layout change is required beyond displaying slash-separated capability names already rendered as `delta.capability`.
- No package, Store, or main-spec discovery changes.
