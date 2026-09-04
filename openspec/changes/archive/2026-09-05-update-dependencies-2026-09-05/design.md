## Context

See `proposal.md` for motivation. The repository currently resolves `fast-uri@3.1.5` through AJV and `fast-uri@4.1.2` through Fastify's schema toolchain; both are inside the ranges reported by `npm audit`. Their parent dependency ranges permit patched releases, so the lockfile should be corrected without an override. The remaining nine direct updates are patch/minor releases accepted by the existing caret ranges.

The repository declares Node `>=20.19.0` and npm `11.19.0`. OpenSpec 1.12.0 still declares Node `>=20.19.0` and no package-manager requirement. The local runtime is newer, but published compatibility policy remains unchanged. `svelte-check@4.7.6` accepts TypeScript 5 or 6 and excludes TypeScript 7.

## Goals / Non-Goals

**Goals:**

- Remove every `fast-uri` version covered by the current advisories without introducing a manual override.
- Apply the nine reviewed, semver-compatible direct dependency updates as one bounded maintenance batch.
- Keep the lockfile and third-party license notice reproducible and reviewable.
- Preserve all test, typecheck, build, packaging, and OpenSpec validation gates.

**Non-Goals:**

- TypeScript 7 migration or replacement of the Svelte typechecking toolchain.
- Updating `engines.node`, `packageManager`, or the package's own version.
- Publishing to npm, creating a Git tag, or changing release notes.
- Functional changes to the CLI, server, or UI.
- Broad transitive overrides unrelated to a reported advisory.

## Decisions

### Update the reviewed direct dependencies explicitly

Install the nine versions listed in `proposal.md` explicitly, separating runtime dependencies from development dependencies so their manifest sections remain stable. This makes the intended `package.json` changes reviewable while allowing npm to refresh compatible transitive resolutions in `package-lock.json`.

Alternative considered: run an unrestricted `npm update`. The resulting target set can change with registry state and can introduce unrelated lockfile churn, so it is not deterministic enough for this Change.

### Resolve `fast-uri` through the lockfile before considering overrides

After the direct updates, inspect `npm ls fast-uri --all` and `npm audit`. The current parent ranges (`^3.0.1` and `^4.0.0`) admit patched releases, so npm should resolve non-vulnerable 3.x and 4.x versions naturally. If vulnerable versions remain, use a targeted lockfile refresh for `fast-uri`; do not add an `overrides` entry unless normal compatible resolution is demonstrably impossible and the Change artifacts are reviewed again.

Alternative considered: immediately pin `fast-uri` through `overrides`. That increases long-term manifest ownership of a transitive dependency without evidence that it is necessary.

### Keep TypeScript 6 and published runtime declarations unchanged

Keep TypeScript at `^6.0.3` because the installed stable `svelte-check` peer range excludes TypeScript 7. Keep Node `>=20.19.0` and npm `11.19.0` because this maintenance batch does not change supported runtime policy and OpenSpec 1.12.0 does not impose a new package-manager constraint.

Alternative considered: bundle TypeScript 7 because it appears under `npm outdated --latest`. That would be a toolchain migration requiring separate compatibility work rather than a routine dependency refresh.

### Treat generated notices and release verification as required outputs

Regenerate `ThirdPartyNotices.txt` after the lockfile settles, then review it alongside `package.json` and `package-lock.json`. Run typecheck, the full test suite, production build, `npm audit`, strict OpenSpec validation, and the repository release verifier. Successful compilation alone is insufficient because dependency changes can affect packaging and license inventory.

## Risks / Trade-offs

- [A compatible Svelte or shadcn update changes generated or rendered output] → Run frontend tests, typecheck, and the production build; inspect unexpected generated-file diffs before accepting them.
- [Fastify patch updates alter server behavior] → Run server and integration tests, then require the full suite to pass.
- [Lockfile regeneration updates unrelated transitive packages] → Review `package-lock.json` and reject unexplained churn outside the nine direct updates and security resolution.
- [License metadata changes] → Regenerate `ThirdPartyNotices.txt` and review all additions, removals, and text changes.
- [The current environment refuses an uncached remote tarball] → Do not weaken npm security settings in code; repeat installation in an authorized registry-enabled environment and retain the same reviewed version targets.
- [Audit advisories change between planning and apply] → Require a fresh `npm audit` result and document any newly reported issue before completing the Change.

## Migration Plan

1. Install the nine explicit direct versions and review manifest and lockfile scope.
2. Verify `fast-uri` resolves outside all advisory ranges; apply only a targeted compatible lock refresh if needed.
3. Regenerate and review `ThirdPartyNotices.txt`.
4. Run all repository and release verification gates, including a fresh zero-vulnerability audit.

Rollback restores only the dependency manifest, lockfile, and generated notice changes from this Change; no application data migration is involved.
