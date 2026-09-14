## 1. Shared capability discovery

- [x] 1.1 Extract a shared walker from `src/parser/specs.ts` that, given a `specs/` root, yields directories with a direct `spec.md`, using posix-relative capability names, skipping empty parents and dot-directories, and omitting missing files without error, then verify existing `src/parser/specs.test.ts` nested/empty-parent/deleted-file cases still pass
- [x] 1.2 Switch `parseSpecs` onto that walker without changing `Spec` parsing, and verify `parseSpecs` still returns the same nested capability names (`auth`, `network/auth`, `network/dns`, `top-level`)

## 2. Nested change spec deltas

- [x] 2.1 Point `parseSpecDeltas` at the shared walker, parse delta operations as today, sort results alphabetically by capability identity, and verify a nested `specs/network/auth/spec.md` is returned with capability `network/auth`
- [x] 2.2 Verify mixed trees (`specs/explorer-pane/spec.md` plus `specs/network/auth/spec.md`) parse as two deltas, skip empty parents, omit deleted retired delta files without error, and sort as `explorer-pane` then `network/auth`
- [x] 2.3 Verify nested `spec.md` files remain excluded from change file groups and Other Files, and that a nested delta's mtime still drives `lastModified`

## 3. Search routing

- [x] 3.1 Add search fixtures for a nested change spec delta and verify a body match returns one `change` result whose `matchLocation.specDeltaCapability` is `network/auth`
- [x] 3.2 Verify a capability-path metadata match (`network/auth` or `.../specs/network/auth/spec.md`) returns one `change` result without duplicating a combined body+metadata hit

## 4. Downstream sanity

- [x] 4.1 Confirm `specDeltaCount`, ChangeViewer Spec Deltas, and `sync` still consume `specDeltas.length` / `delta.capability` with no API or type changes, then run the parser and search test files and verify they pass
