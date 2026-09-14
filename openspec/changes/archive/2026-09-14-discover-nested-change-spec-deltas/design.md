## Context

See proposal.md — Why. Main capability specs already recurse in `src/parser/specs.ts` (`walkSpecsDirectory`, capability identity = path relative to `specs/` with `/`). Change spec deltas still use a one-level `readdir` in `parseSpecDeltas` (`src/parser/changes.ts`): `specs/<dir>/spec.md` only. `discoverChangeFiles` skips the entire `specs/` tree, and `discoverOtherFiles` only reads the change root, so nested `spec.md` files are not recovered as regular files or Other Files. `lastModified` already walks `specs/` recursively via `discoverContentFilePaths`. Search and ChangeViewer consume `change.specDeltas` as-is, including `delta.capability` as the display and `matchLocation.specDeltaCapability` identity.

## Goals / Non-Goals

**Goals:**
- Make change spec-delta discovery use the same nested-tree rules as main specs.
- Keep `SpecDelta.capability` as the identity string consumed by counts, ChangeViewer, `sync`, and search.
- Prevent the two walkers from drifting again.

**Non-Goals:**
- No tree UI, grouping, or breadcrumb redesign for Spec Deltas; slash-separated names are enough, matching Explorer SPECS.
- No write/create path for nested deltas, Store changes, or main-spec discovery changes.
- No API/type field additions; `capability: string` already holds nested names.

## Decisions

**D1: Fix discovery in the parser; leave frontend contracts alone.**
Explorer counts, Dashboard, ChangeViewer Spec Deltas, `sync` chips, and search already iterate `specDeltas`. Once nested entries appear with slash identities, those surfaces render and route correctly. Alternative: teach ChangeViewer a second nested scanner — rejected because it would duplicate the parser and leave `specDeltaCount` / search wrong.

**D2: Share capability-directory discovery between main specs and change deltas.**
Extract a small walker that, given a `specs/` root, yields directories that directly contain `spec.md`, with:
- recursive descent at any depth
- capability name = posix-relative path from that root (`network/auth`)
- empty parents skipped
- dot-directories skipped
- missing `spec.md` omitted without error

`parseSpecs` and `parseSpecDeltas` both consume it, then keep their own content parsers (`parseCapability` vs delta operations). Alternative: copy `walkSpecsDirectory` into `changes.ts` — rejected because that copy is how this bug survived v1.8. Alternative: make `parseSpecDeltas` call `parseSpecs` — rejected because `parseSpecs` is bound to an OpenSpec root and `Spec` records, not change-local delta operations.

**D3: Sort deltas alphabetically by capability identity after discovery.**
Matches main spec listing and the new Spec Deltas contract. `parseSpecDeltas` currently preserves `readdir` order; sorting is an observable but compatible tightening for mixed trees.

**D4: Search needs no path-join rewrite.**
`searchChange` already builds `.../specs/${delta.capability}/spec.md` and stores `specDeltaCapability: delta.capability`. Nested names flow through. Tests should cover nested body and capability-path metadata hits; implementation stays on the existing loop.

## Risks / Trade-offs

- [Shared walker regresses main spec discovery] → Mitigation: keep existing `src/parser/specs.test.ts` nested/empty-parent/deleted-file cases; add delta fixtures beside them rather than rewriting spec tests.
- [Slash capability names break a consumer that assumed a single path segment] → Mitigation: audit is limited to string compare/display/`specs/${capability}/spec.md` construction, which already matches main-spec nested names; add parser and search tests for `network/auth`.
- [Alphabetical sort changes existing delta order] → Mitigation: only the listing order changes; identity and counts stay the same. Tests should assert sorted names rather than `readdir` order.

## Migration Plan

Additive and backwards compatible. Existing flat `specs/<capability>/spec.md` deltas remain valid as depth-1 results of the recursive walk. Rollback: restore the one-level `parseSpecDeltas` loop and drop the shared walker usage from changes; main spec discovery can keep the extracted walker.

## Open Questions

None. Nested identity, empty-parent skipping, and parser-only scope are fixed by the specs.
