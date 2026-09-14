## Context

See `proposal.md` for motivation. The repository currently resolves all direct dependencies without known `npm audit` findings, but 10 direct packages have newer patch or minor releases accepted by the existing caret ranges. An isolated trial update on Node 22 completed the repository release verifier successfully, including 749 tests, typechecking, build, package installation, CLI startup, and the packaged tool-reference API smoke test.

The repository declares Node `>=20.19.0` and npm `11.19.0`. `svelte-check@4.7.6` accepts TypeScript 5 or 6 and excludes TypeScript 7, so the latest TypeScript major is not part of this maintenance update.

## Goals / Non-Goals

**Goals:**

- Apply the 10 reviewed, semver-compatible direct dependency updates as one deterministic maintenance batch.
- Keep direct declarations, the resolved lockfile, and generated third-party notices synchronized.
- Preserve a zero-vulnerability audit result and all typecheck, test, build, packaging, and installed-CLI verification gates.
- Review transitive lockfile changes and retain only changes explained by the selected direct updates.

**Non-Goals:**

- TypeScript 7 migration or replacement of the Svelte typechecking toolchain.
- Updating Node/npm compatibility declarations or the package's own version.
- Publishing to npm, creating a Git tag, or changing release notes.
- Functional changes to the CLI, server, frontend, or persisted data.
- Adding overrides or forcing unrelated transitive upgrades.

## Decisions

### Install reviewed direct versions explicitly

Install the three runtime dependencies and seven development dependencies at the exact target versions listed in `proposal.md`, while preserving caret declarations and manifest sections. Explicit targets keep the update reproducible and reviewable while allowing npm to resolve their compatible transitives.

Alternative considered: unrestricted `npm update`. The target set and transitive churn can change with registry state, so it is less deterministic than installing the reviewed versions.

### Keep TypeScript 6

Keep `typescript@^6.0.3` because the current stable `svelte-check` peer range is `^5.0.0 || ^6.0.0`. TypeScript 7 requires a separate toolchain migration after Svelte tooling declares compatibility.

Alternative considered: include TypeScript 7 because it is the only remaining result under `npm outdated --latest`. This would knowingly introduce an invalid peer combination and expand a routine maintenance update into a migration.

### Review transitive changes by dependency path

Accept transitive version changes and removals only when npm attributes them to the selected direct updates. In particular, Paraglide may update its Inlang/Lix subtree and Vite may update its Rolldown subtree. Do not add overrides or retain stale packages solely to minimize the diff.

Alternative considered: manually pin every transitive package. That would create unnecessary ownership of implementation details controlled by direct dependencies.

### Treat release artifacts and the full verifier as required

Regenerate `ThirdPartyNotices.txt` after the dependency tree settles. Run `npm audit`, typecheck, tests, build, and `node ./scripts/verify-release.mjs`; the verifier's packed installation and startup checks are required because runtime dependencies are resolved again for consumers outside the development lockfile.

Alternative considered: rely only on build and unit tests. That would not verify tarball contents, installed CLI behavior, or generated license metadata.

## Risks / Trade-offs

- [Marked parser fixes alter rendered Markdown output] → Run frontend Markdown tests and the full suite; reject unexpected behavior changes outside upstream correctness fixes.
- [Fastify, YAML, or `open` patches alter server/CLI behavior] → Require server integration tests and the packed CLI startup smoke test.
- [Lucide, Bits UI, or Tailwind Merge updates affect bundled frontend output] → Require Svelte diagnostics, frontend tests, and a production build.
- [Lockfile regeneration introduces unexplained churn] → Compare package versions before and after and trace each changed subtree to one of the 10 direct updates.
- [Registry security policy blocks an uncached optional tarball] → Do not weaken repository security configuration; perform installation in an authorized registry-enabled environment using the same reviewed targets.
- [Registry advisories change during implementation] → Run a fresh audit and stop if any unresolved vulnerability appears.

## Migration Plan

1. Install the three runtime and seven development dependency targets explicitly with the repository-declared package-manager policy.
2. Review `package.json` and `package-lock.json`, including direct versions, peer validity, transitive changes, and dependency removals.
3. Regenerate and review `ThirdPartyNotices.txt`.
4. Run the audit and every repository/release verification gate.

Rollback restores only `package.json`, `package-lock.json`, and `ThirdPartyNotices.txt`; no application data migration is involved.
