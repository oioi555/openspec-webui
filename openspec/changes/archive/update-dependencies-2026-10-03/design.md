# Design

## Context

See `proposal.md` for motivation. The repository currently has 6 in-range direct updates (runtime `@fastify/static` plus five development packages) and four `npm audit` findings, all marked fixable without `--force`. OpenSpec CLI still declares `engines.node: ">=20.19.0"` and no package-manager requirement. `svelte-check@4.7.6` accepts TypeScript 5 or 6 and excludes TypeScript 7. Other runtime directs already match their latest in-range versions.

`@fastify/static@10.1.4` and `10.1.5` declare the same `glob@^13.0.0`, so installing the direct patch alone may leave `brace-expansion@5.0.9` in the lockfile. The WebUI listens on `127.0.0.1` over HTTP/1 and still serves packaged frontend assets through `@fastify/static`. Active change `support-openspec-v1-14-0` is implemented and unarchived; its files stay out of this batch.

## Goals / Non-Goals

**Goals:**

- Apply the 6 reviewed, semver-compatible direct dependency updates as one deterministic maintenance batch.
- Restore a zero-vulnerability audit result by running `npm audit fix` without `--force` after the explicit direct installs.
- Keep direct declarations, the resolved lockfile, and generated third-party notices synchronized.
- Keep all typecheck, test, build, packaging, and installed-CLI verification gates green.
- Review transitive lockfile changes and retain only changes explained by the selected direct updates or the audit-fix parents.

**Non-Goals:**

- TypeScript 7 migration or replacement of the Svelte typechecking toolchain.
- Updating Node/npm compatibility declarations or the package's own version.
- Publishing to npm, creating a Git tag, or changing release notes.
- Functional changes to the CLI, server, frontend, or persisted data.
- Adding overrides, adding the four advisory packages as direct dependencies, or regenerating copied shadcn-svelte UI components.
- Mixing implementation or planning files from `support-openspec-v1-14-0` into this Change.

## Decisions

### Install reviewed direct versions explicitly

Install the one runtime dependency and five development dependencies at the exact target versions listed in `proposal.md`, while preserving caret declarations and existing manifest sections. Explicit targets keep the update reproducible and reviewable while allowing npm to resolve their compatible transitives.

Alternative considered: unrestricted `npm update`. The target set and transitive churn can change with registry state, so it is less deterministic than installing the reviewed versions.

### Resolve advisories with `npm audit fix`, not new directs

After the explicit installs, run `npm audit fix` without `--force`. Accept lockfile-only bumps for `brace-expansion`, `fast-uri`, `undici`, and `ip-address` when npm attributes them to existing parents. Do not add those packages to `package.json` and do not introduce `overrides`.

`@fastify/static@10.1.5` is still required as a reviewed direct (registered-root download fix), even though it may not by itself bump `brace-expansion`. Task 3.4 requires `npm audit` to report zero known vulnerabilities, matching the existing `package-distribution` requirement.

Alternative considered: install only the 6 directs and leave the four advisories for a later change. That would fail the audit gate and leave runtime `brace-expansion` / `fast-uri` findings in the published tree.

Alternative considered: add `overrides` or promote the four packages to direct dependencies. That would take ownership of implementation details controlled by parents and expand a routine lockfile refresh into a pinning policy.

### Keep TypeScript 6

Keep `typescript@^6.0.3` because the current stable `svelte-check` peer range is `^5.0.0 || ^6.0.0`. TypeScript 7 requires a separate toolchain migration after Svelte tooling declares compatibility.

Alternative considered: include TypeScript 7 because it is the only remaining result under `npm outdated --latest`. This would knowingly introduce an invalid peer combination and expand a routine maintenance update into a migration.

### Review transitive changes by dependency path

Accept transitive version changes and removals only when npm attributes them to the selected direct updates or to the audit-fix parents. Vite may refresh toolchain subtrees. Do not add overrides or retain stale packages solely to minimize the diff.

Alternative considered: manually pin every transitive package. That would create unnecessary ownership of implementation details controlled by direct dependencies.

### Treat release artifacts and the full verifier as required

Regenerate `ThirdPartyNotices.txt` after the dependency tree settles. Run `npm audit`, typecheck, tests, build, and `node ./scripts/verify-release.mjs`. Packed installation and startup checks remain required because `@fastify/static` is a runtime direct and Vite / Lucide / bits-ui affect packaged frontend assets.

Alternative considered: skip the packed CLI verifier because most of the batch is development-only. That would miss static-serving and frontend asset regressions introduced by the runtime and Vite patches.

## Risks / Trade-offs

- [`@fastify/static` 10.1.5 changes registered-root relative downloads] → Keep local HTTP/1 binding unchanged; run server tests and packed CLI startup checks.
- [Vite 8.3.2 CSS preload, sourcemap, srcset, or worker URL fixes change the production bundle] → Require a production build and `verify-release.mjs` packaged-asset checks.
- [bits-ui 2.19.4 PopperLayer / DismissibleLayer fixes affect copied UI primitives] → Run frontend tests; do not regenerate shadcn components.
- [Lucide 1.50.0 adds or changes icons that shift the frontend bundle] → Require a production build and review unexpected generated-file changes.
- [`npm audit fix` pulls additional unexplained lockfile churn] → Compare package versions before and after; keep only subtrees explained by the 6 directs or the four advisory parents; stop if `--force` would be required.
- [Lockfile regeneration introduces unexplained churn from the 6-direct install] → Trace each changed subtree to one of the reviewed directs.
- [Registry security policy blocks an uncached optional tarball (`EALLOWREMOTE`)] → Do not weaken repository security configuration; perform installation in an authorized registry-enabled environment using the same reviewed targets.
- [Registry advisories change during implementation] → Run a fresh audit and stop if any unresolved vulnerability remains after the reviewed updates and `npm audit fix`.

## Migration Plan

1. Install the six direct targets explicitly with the repository-declared package-manager policy.
2. Run `npm audit fix` without `--force`.
3. Review `package.json` and `package-lock.json`, including direct versions, peer validity, transitive changes, and dependency removals. Confirm the four advisory packages are lockfile-only.
4. Regenerate and review `ThirdPartyNotices.txt`.
5. Run the audit and every repository/release verification gate.

Rollback restores only `package.json`, `package-lock.json`, and `ThirdPartyNotices.txt`; no application data migration is involved.
