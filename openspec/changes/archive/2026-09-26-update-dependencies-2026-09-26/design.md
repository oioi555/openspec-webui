# Design

## Context

See `proposal.md` for motivation. The repository currently has 7 in-range direct development-dependency updates and a clean `npm audit`. OpenSpec CLI 1.13.2 still declares `engines.node: ">=20.19.0"` and no package-manager requirement. `svelte-check@4.7.6` accepts TypeScript 5 or 6 and excludes TypeScript 7. Runtime direct dependencies already match their latest in-range versions.

## Goals / Non-Goals

**Goals:**

- Apply the 7 reviewed, semver-compatible direct development-dependency updates as one deterministic maintenance batch.
- Keep direct declarations, the resolved lockfile, and generated third-party notices synchronized.
- Keep a zero-vulnerability audit result and keep all typecheck, test, build, packaging, and installed-CLI verification gates green.
- Review transitive lockfile changes and retain only changes explained by the selected direct updates.

**Non-Goals:**

- TypeScript 7 migration or replacement of the Svelte typechecking toolchain.
- Updating Node/npm compatibility declarations or the package's own version.
- Publishing to npm, creating a Git tag, or changing release notes.
- Functional changes to the CLI, server, frontend, or persisted data.
- Adding overrides or regenerating copied shadcn-svelte UI components.

## Decisions

### Install reviewed direct versions explicitly

Install the seven development dependencies at the exact target versions listed in `proposal.md`, while preserving caret declarations and the existing `devDependencies` section. Explicit targets keep the update reproducible and reviewable while allowing npm to resolve their compatible transitives.

Alternative considered: unrestricted `npm update`. The target set and transitive churn can change with registry state, so it is less deterministic than installing the reviewed versions.

### Keep TypeScript 6

Keep `typescript@^6.0.3` because the current stable `svelte-check` peer range is `^5.0.0 || ^6.0.0`. TypeScript 7 requires a separate toolchain migration after Svelte tooling declares compatibility.

Alternative considered: include TypeScript 7 because it is the only remaining result under `npm outdated --latest`. This would knowingly introduce an invalid peer combination and expand a routine maintenance update into a migration.

### Review transitive changes by dependency path

Accept transitive version changes and removals only when npm attributes them to the selected direct updates. Vite and the Svelte plugin may refresh their toolchain subtrees. Do not add overrides or retain stale packages solely to minimize the diff.

Alternative considered: manually pin every transitive package. That would create unnecessary ownership of implementation details controlled by direct dependencies.

### Treat release artifacts and the full verifier as required

Regenerate `ThirdPartyNotices.txt` after the dependency tree settles, even though this batch is development-only, so any license-file drift is reviewed rather than assumed empty. Run `npm audit`, typecheck, tests, build, and `node ./scripts/verify-release.mjs`; the packed installation and startup checks remain required because Vite, the Svelte plugin, and Lucide affect packaged frontend assets.

Alternative considered: skip the packed CLI verifier because no runtime direct dependency changes. That would miss frontend asset regressions introduced by the Vite and Svelte plugin patches.

## Risks / Trade-offs

- [Vite 8.3.1 optimizer, sourcemap, or watcher fixes change the production bundle] → Require a production build and `verify-release.mjs` packaged-asset checks.
- [`@sveltejs/vite-plugin-svelte` 7.3.1 changes compile or HMR behavior] → Require Svelte diagnostics, frontend tests, and a production build.
- [bits-ui 2.19.3 focus-scope, Dialog, or `user-select` fixes affect copied UI primitives] → Run frontend tests; do not regenerate shadcn components.
- [Lucide 1.48.0 adds or changes icons that shift the frontend bundle] → Require a production build and review unexpected generated-file changes.
- [`tsx` 4.23.15 changes TypeScript execution used by tests] → Run the complete test suite.
- [Lockfile regeneration introduces unexplained churn] → Compare package versions before and after and trace each changed subtree to one of the 7 direct updates.
- [Registry security policy blocks an uncached optional tarball (`EALLOWREMOTE`)] → Do not weaken repository security configuration; perform installation in an authorized registry-enabled environment using the same reviewed targets.
- [Registry advisories change during implementation] → Run a fresh audit and stop if any unresolved vulnerability remains after the reviewed updates.

## Migration Plan

1. Install the seven development-dependency targets explicitly with the repository-declared package-manager policy.
2. Review `package.json` and `package-lock.json`, including direct versions, peer validity, transitive changes, and dependency removals.
3. Regenerate and review `ThirdPartyNotices.txt`.
4. Run the audit and every repository/release verification gate.

Rollback restores only `package.json`, `package-lock.json`, and `ThirdPartyNotices.txt`; no application data migration is involved.
