## Context

`openspec-webui@0.3.5` (package version stays unchanged during this Change) is a local-first CLI + browser UI. `package.json` currently pins `engines.node` to `>=20.0.0`, while the current OpenSpec CLI (`@fission-ai/openspec` 1.8.0, which this project shells out to) declares `engines.node: ">=20.19.0"`. The dependency tree is several majors behind latest stable and carries 16 npm audit findings.

Current audit baseline (2026-08-12, `npm audit`): 16 findings = 1 critical, 12 high, 2 moderate, 1 low.

| Severity | Package | Direct? | Exposure |
|---|---|---|---|
| critical | tar | transitive | tooling chain (npm/generate-license-file etc.) |
| high | @fastify/static | direct | runtime static serving |
| high | vite | direct | dev/build toolchain |
| high | undici | transitive | tooling network stack |
| high | ws | transitive | runtime (fastify websocket) |
| high | find-my-way / fast-uri / ip-address | transitive | runtime (fastify routing) |
| high | brace-expansion / js-yaml / nanoid / postcss | transitive | tooling |
| high | sigstore | transitive | tooling (release signing helpers) |
| moderate | @sigstore/core, @sigstore/verify | transitive | tooling |
| low | esbuild | transitive | dev server (Windows only) |

Latest stable versions verified via npm registry on 2026-08-12 (re-verify at implementation time):

- **deps**: `@fastify/static` 10.1.3, `@fastify/websocket` 11.3.0, chokidar 5.0.0, commander 15.0.0, fastify 5.11.3, open 11.0.0, yaml 2.9.0
- **devDeps**: `@inlang/paraglide-js` 2.23.2, `@inlang/plugin-message-format` 4.4.1, `@lucide/svelte` 1.31.0, `@sveltejs/vite-plugin-svelte` 7.3.0, `@tailwindcss/typography` 0.5.20, `@tailwindcss/vite` 4.3.3, `@types/node` 26.2.0, `@types/ws` 8.18.1, bits-ui 2.18.1, clsx 2.1.1, generate-license-file 4.2.1, marked 18.0.9, shadcn-svelte 1.5.0, svelte 5.56.8, svelte-check 4.7.5, svelte-sonner 1.1.1, tailwind-merge 3.6.0, tailwindcss 4.3.3, tailwindcss-animate 1.0.7, tsx 4.23.12, typescript 7.0.2, vite 8.2.1

Engine constraints of new majors: Vite 8 = `^20.19.0 || >=22.12.0`; `@sveltejs/vite-plugin-svelte` 7 = `^20.19 || ^22.12 || >=24`. `engines.node: ">=20.19.0"` satisfies all.

## Goals / Non-Goals

**Goals:**
- Every direct dependency and devDependency at latest stable, majors included, to reduce maintenance frequency.
- `engines.node` exactly aligned with the current OpenSpec CLI minimum (`>=20.19.0`).
- Zero known npm audit vulnerabilities where resolvable; any unavoidable residual documented with dependency path and exposure.
- Preserve product behavior and package version (`0.3.5`); all compatibility/config changes are internal.
- Regenerate `package-lock.json` and `ThirdPartyNotices.txt` as part of the change.

**Non-Goals:**
- New or modified capabilities, or any spec/delta-spec changes (`skip_specs: true`).
- Product version bump or release — that is a separate later phase.
- Blind `npm audit fix --force` or other blanket/force update strategies.
- Repo-side hacks to work around the local `EALLOWREMOTE` issue for `@tailwindcss/oxide-wasm32-wasi` (environment/config problem; use explicit dependency install/update instead).

## Decisions

### Decision 1: Explicit declared-package upgrades, then lockfile regeneration

Update every direct dependency/devDependency in `package.json` to the latest stable version (query `npm view <pkg> version` at implementation time rather than trusting this document's snapshot blindly), then run `npm install` to regenerate `package-lock.json`. Use non-force `npm audit fix` only afterwards for any fixable transitives not already resolved.

- **Adopted**: explicit declaration updates + `npm install` regeneration. The regenerated lockfile naturally resolves latest compatible transitives (tar, undici, postcss, js-yaml, nanoid, brace-expansion, ip-address, fast-uri, find-my-way, ws, sigstore, esbuild), which is expected to clear the majority of audit findings.
- **Alternative rejected**: `npm audit fix --force` — risks unintended breaking transitive updates without review, and is explicitly disallowed.

### Decision 2: `engines.node` = `>=20.19.0`

Align exactly with the current OpenSpec CLI minimum (`@fission-ai/openspec` declares `>=20.19.0`). This also satisfies Vite 8 (`^20.19.0 || >=22.12.0`) and `@sveltejs/vite-plugin-svelte` 7 (`^20.19 || ^22.12 || >=24`), and both Node 20.19+ and all Node 22/24 LTS lines are covered.

- **Adopted**: single, precise floor of `>=20.19.0`.
- **Alternative rejected**: keep `>=20.0.0` — would advertise a runtime the new toolchain does not support.

### Decision 3: `@fastify/static` 9→10 needs no code change

The known v10 breaking change concerns the `setHeaders` option, which this project does not use (`src/server/index.ts` registers `fastifyStatic` without it). Expect no code change; verify via the static SPA smoke test.

### Decision 4: New majors may require config/code compatibility work

TypeScript 7, Vite 8, and `@sveltejs/vite-plugin-svelte` 7 may require tsconfig, `frontend/vite.config.ts`, or plugin option adjustments, and could surface type errors after `@types/node` 26 and `@inlang/paraglide-js` 2.23. Fix only what the new toolchain demands; do not change product behavior. `marked` 18, chokidar 5, commander 15, and open 11 are expected to be API-compatible with current usage (`frontend/src/lib/markdown.ts`, `src/watcher/file-watcher.ts`, `src/cli/index.ts`).

### Decision 5: Treat `EALLOWREMOTE` as an environment/config issue

`npm audit fix --dry-run` currently fails with `EALLOWREMOTE` for `@tailwindcss/oxide-wasm32-wasi` in this local environment. This is an npm registry/config issue, not a repo problem. Do not add repo hacks (e.g., forced resolutions, `.npmrc` overrides, pinning to broken versions). Instead, upgrade declared packages explicitly and run audit checks as informational verification; if a blanket audit-fix is needed, fix the npm config locally outside the repo.

## Risks / Trade-offs

- **[Risk] Vite 8 / vite-plugin-svelte 7 break the frontend build or dev server** → **Mitigation**: run `npm run build`, `npm run typecheck`, and a frontend dev/build smoke early; adjust `frontend/vite.config.ts` as required.
- **[Risk] TypeScript 7 introduces new errors or stricter defaults** → **Mitigation**: run `tsc` build + `--noEmit` typecheck and `svelte-check`; fix type/config issues; do not suppress with `any` unless unavoidable.
- **[Risk] Runtime behavior changes after @fastify/static 10 / fastify 5 / open 11 / chokidar 5** → **Mitigation**: focused runtime smokes (server/static SPA, watcher, CLI `--no-open`), plus the packed-CLI smoke in `verify-release.mjs`.
- **[Risk] Some audit findings persist after upgrade (e.g., tooling-only transitives without published fixes)** → **Mitigation**: document each residual with dependency path and why it cannot be resolved; acceptance is "zero where resolvable".
- **[Risk] Large lockfile diff hides unintended changes** → **Mitigation**: review `git diff` of `package.json`/`package-lock.json` for declared-only changes; confirm `ThirdPartyNotices.txt` diff matches the resolved tree.
- **[Risk] Node version drift: current env runs Node 22, `verify-release`/CI may differ** → **Mitigation**: verify `engines.node` is honored (`npm` engine-strict behavior) and run checks on the minimum supported Node where feasible.
