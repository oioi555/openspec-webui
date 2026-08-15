## Context

See `proposal.md` for motivation. The dependency tree was fully refreshed on 2026-08-12 and currently audits cleanly, so this change is a small post-release update rather than a migration. Seven direct packages have newer versions within their declared semver ranges; TypeScript 7 is the only newer direct package outside the supported toolchain.

The upstream `@fission-ai/openspec@1.9.0` package declares Node `>=20.19.0` and does not publish an npm version requirement or `packageManager` field. It also documents installation through npm, pnpm, bun, yarn, and volta. This repository uses npm and a version 3 lockfile.

## Goals / Non-Goals

**Goals:**

- Resolve all compatible direct dependencies to the current registry versions.
- Preserve deterministic npm installs and regenerate third-party notices from the resulting tree.
- Keep every existing validation gate green and retain a zero-vulnerability audit.
- Document why the npm and TypeScript declarations do or do not move.

**Non-Goals:**

- Adopting TypeScript 7 before official Svelte toolchain support.
- Changing package manager solely because upstream uses a different manager internally.
- Manually overriding transitive package versions without an audit or compatibility need.
- Changing runtime, CLI, API, or UI behavior.

## Decisions

### 1. Update compatible declarations explicitly

Update `fastify` 5.11.3 to 5.12.0, `open` 11.0.0 to 11.0.1, `@inlang/paraglide-js` 2.23.2 to 2.24.1, `@inlang/plugin-message-format` 4.4.1 to 4.4.3, `svelte` 5.56.8 to 5.56.9, `svelte-check` 4.7.5 to 4.7.6, and `svelte-sonner` 1.1.1 to 1.2.1. Then regenerate the lockfile through npm.

Explicit package installs are preferred over a blanket `npm update` because this environment has a known `EALLOWREMOTE` failure while dry-running the optional `@tailwindcss/oxide-wasm32-wasi` package. The explicit approach also makes the intended direct changes reviewable.

### 2. Keep TypeScript at `^6.0.3`

`svelte-check@4.7.6` declares TypeScript `^5.0.0 || ^6.0.0`. TypeScript 7 replaces the JavaScript compiler API with the native compiler and currently causes `svelte-check` to crash during startup. The update trigger is a stable `svelte-check` release whose peer range includes TypeScript 7 and whose typecheck passes in this repository.

Forcing the peer dependency or replacing the official checker is rejected because either would weaken the established validation gate.

### 3. Follow upstream's declared requirements, not its incidental local toolchain

Keep `engines.node` at `>=20.19.0`, matching OpenSpec CLI 1.9.0. Keep `packageManager` at `npm@11.19.0` because upstream publishes no npm version requirement. If a future OpenSpec CLI release declares an npm constraint, update this repository to the compatible version in the same maintenance change.

Copying upstream's internal pnpm workflow is rejected: OpenSpec explicitly supports multiple installation managers, and changing managers would create lockfile and release-process churn without satisfying a published compatibility requirement.

### 4. Let direct updates resolve transitives

Do not add overrides for outdated transitive majors shown by `npm outdated --all`. Their owners control compatibility, and `npm audit` currently reports no vulnerabilities. Review the regenerated tree and intervene only if audit or validation identifies a concrete problem.

### 5. Verify generated and packaged outputs

Run typecheck, tests, production build, audit, and the repository's release verifier. Regenerate `ThirdPartyNotices.txt` using the existing release/build process and review it alongside the lockfile.

## Risks / Trade-offs

- **[Risk] Paraglide compiler changes alter generated modules** -> Run compilation through typecheck/build and review generated-file changes.
- **[Risk] `svelte-sonner` 1.2 changes toast rendering or styles** -> Exercise existing UI tests and perform a focused toast smoke if automated coverage is insufficient.
- **[Risk] Fastify 5.12 changes server routing behavior** -> Run server/integration and release packed-CLI checks.
- **[Risk] Lockfile regeneration introduces unrelated transitive churn** -> Review the manifest and lockfile diff; retain only resolutions produced by the seven direct updates.
- **[Risk] Local npm 12 behavior differs from declared npm 11** -> Use repository scripts that already support npm 12, while retaining the upstream-driven declaration policy.

## Migration Plan

1. Install the seven explicit target versions and regenerate `package-lock.json`.
2. Regenerate third-party notices.
3. Run all validation gates and inspect dependency/audit output.
4. If validation fails, revert only this change's dependency resolutions and keep the released v1.0.0 dependency baseline.
