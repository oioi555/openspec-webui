# Design

## Context

See `proposal.md` for motivation. The repository currently has 9 in-range direct updates and one moderate `npm audit` finding: `devalue@5.9.0` via `svelte@5.57.0`. OpenSpec CLI 1.13.1 still declares `engines.node: ">=20.19.0"` and no package-manager requirement. `svelte-check@4.7.6` accepts TypeScript 5 or 6 and excludes TypeScript 7.

The WebUI listens on `127.0.0.1` over HTTP/1 and does not enable Fastify `http2` or `reply.trailer()`. `@fastify/static` still serves packaged frontend assets.

## Goals / Non-Goals

**Goals:**

- Apply the 9 reviewed, semver-compatible direct dependency updates as one deterministic maintenance batch.
- Resolve the `devalue` advisory by installing `svelte@5.57.1`, which requires `devalue@^5.9.2`.
- Keep direct declarations, the resolved lockfile, and generated third-party notices synchronized.
- Restore a zero-vulnerability audit result and keep all typecheck, test, build, packaging, and installed-CLI verification gates green.
- Review transitive lockfile changes and retain only changes explained by the selected direct updates.

**Non-Goals:**

- TypeScript 7 migration or replacement of the Svelte typechecking toolchain.
- Updating Node/npm compatibility declarations or the package's own version.
- Publishing to npm, creating a Git tag, or changing release notes.
- Functional changes to the CLI, server, frontend, or persisted data.
- Adding overrides, adding `devalue` as a direct dependency, or regenerating copied shadcn-svelte UI components.

## Decisions

### Install reviewed direct versions explicitly

Install the four runtime dependencies and five development dependencies at the exact target versions listed in `proposal.md`, while preserving caret declarations and manifest sections. Explicit targets keep the update reproducible and reviewable while allowing npm to resolve their compatible transitives.

Alternative considered: unrestricted `npm update`. The target set and transitive churn can change with registry state, so it is less deterministic than installing the reviewed versions.

### Resolve devalue through svelte 5.57.1

Install `svelte@5.57.1` so npm resolves `devalue` into `^5.9.2` (patched for GHSA-9rgm-9g3h-6x36). Do not add `devalue` to `package.json` and do not introduce `overrides`.

Alternative considered: `npm update devalue` while keeping `svelte@5.57.0`. That would also satisfy the advisory because `svelte@5.57.0` allows `devalue@^5.8.1`, but it would leave a known in-range svelte patch unapplied. Bundling the svelte patch with the security-related transitive is simpler to review.

### Keep TypeScript 6

Keep `typescript@^6.0.3` because the current stable `svelte-check` peer range is `^5.0.0 || ^6.0.0`. TypeScript 7 requires a separate toolchain migration after Svelte tooling declares compatibility.

Alternative considered: include TypeScript 7 because it is the only remaining result under `npm outdated --latest`. This would knowingly introduce an invalid peer combination and expand a routine maintenance update into a migration.

### Do not regenerate shadcn-svelte components

`shadcn-svelte@1.7.0` changes CLI codegen to emit `cn` instead of `clsx` + `tailwind-merge`. Copied components under `frontend/src/lib/components/ui/` already use the local `cn` helper. Bump the CLI package only; do not re-run component generation.

Alternative considered: regenerate every UI primitive. That would mix a dependency maintenance change with unrelated component diffs.

### Review transitive changes by dependency path

Accept transitive version changes and removals only when npm attributes them to the selected direct updates. Paraglide may update its Inlang/Lix subtree. Do not add overrides or retain stale packages solely to minimize the diff.

Alternative considered: manually pin every transitive package. That would create unnecessary ownership of implementation details controlled by direct dependencies.

### Treat release artifacts and the full verifier as required

Regenerate `ThirdPartyNotices.txt` after the dependency tree settles. Run `npm audit`, typecheck, tests, build, and `node ./scripts/verify-release.mjs`; the verifier's packed installation and startup checks are required because runtime dependencies are resolved again for consumers outside the development lockfile.

Alternative considered: rely only on build and unit tests. That would not verify tarball contents, installed CLI behavior, or generated license metadata.

## Risks / Trade-offs

- [Fastify 5.12.5 HTTP/2 trailer crash is not exercised by this server] → Still take the security release; keep HTTP/1 local binding unchanged and run server integration plus packed CLI startup checks.
- [`@fastify/static` case-insensitive path bypass is mainly a Windows/macOS concern] → Take 10.1.4 because the package is published for those platforms; verify static serving via the existing server and release smoke tests.
- [Svelte 5.57.1 or Lucide icon updates affect bundled frontend output] → Require Svelte diagnostics, frontend tests, and a production build.
- [Paraglide URL trailing-slash fix or Inlang SDK bump changes compiled messages] → Run typecheck and the full suite; reject unexpected i18n or compile output changes.
- [Lockfile regeneration introduces unexplained churn] → Compare package versions before and after and trace each changed subtree to one of the 9 direct updates.
- [Registry security policy blocks an uncached optional tarball (`EALLOWREMOTE`)] → Do not weaken repository security configuration; perform installation in an authorized registry-enabled environment using the same reviewed targets.
- [Registry advisories change during implementation] → Run a fresh audit and stop if any unresolved vulnerability remains after the reviewed updates.

## Migration Plan

1. Install the four runtime and five development dependency targets explicitly with the repository-declared package-manager policy.
2. Review `package.json` and `package-lock.json`, including direct versions, `devalue` resolution (`>=5.9.2`), peer validity, transitive changes, and dependency removals.
3. Regenerate and review `ThirdPartyNotices.txt`.
4. Run the audit and every repository/release verification gate.

Rollback restores only `package.json`, `package-lock.json`, and `ThirdPartyNotices.txt`; no application data migration is involved.
