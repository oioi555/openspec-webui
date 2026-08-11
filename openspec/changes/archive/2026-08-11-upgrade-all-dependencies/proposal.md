## Why

Most direct and dev dependencies are several majors behind latest stable (`@fastify/static` 9→10, Vite 6→8, `@sveltejs/vite-plugin-svelte` 5→7, TypeScript 5→7, chokidar 4→5, commander 13→15, marked 15→18, open 10→11, `@types/node` 22→26), plus many in-range updates. Every skipped major becomes a larger future migration, and the current tree carries 16 npm audit findings (1 critical, 12 high, 2 moderate, 1 low), including runtime dependencies (`@fastify/static`, Vite) and tooling transitives. The goal is to bring every declared dependency to latest stable and resolve known advisories so the next upgrade cycle starts from a clean baseline.

Separately, `engines.node` is `>=20.0.0` while the current OpenSpec CLI (`@fission-ai/openspec` 1.8.0) requires `>=20.19.0`. Aligning the two supported runtimes avoids confusion and satisfies the new toolchain: Vite 8 requires `^20.19.0 || >=22.12.0` and `@sveltejs/vite-plugin-svelte` 7 requires `^20.19 || ^22.12 || >=24`.

## What Changes

- **Bump all direct dependencies to latest stable** (majors included): `@fastify/static` 10, `@fastify/websocket` 11, chokidar 5, commander 15, fastify 5, open 11, yaml 2 (exact versions in design.md; re-verify against npm at implementation time).
- **Bump all devDependencies to latest stable** (majors included): Vite 8, `@sveltejs/vite-plugin-svelte` 7, TypeScript 7, marked 18, `@types/node` 26, plus every in-range update.
- **Set `engines.node` to `>=20.19.0`**, matching the current OpenSpec CLI minimum.
- **Apply necessary compatibility code/config changes** for the new majors while preserving product behavior. Known `@fastify/static` 10 breaking change concerns the `setHeaders` option, which this project does not use.
- **Regenerate `package-lock.json`** from the declared set using explicit dependency install/update commands. No blind `npm audit fix --force`; update declared packages explicitly and let `npm audit fix` (non-force) clean up fixable transitives.
- **Regenerate `ThirdPartyNotices.txt`** from the resolved dependency tree.
- **Keep package version at `0.3.5`**; product version bump/release is a separate, later release phase.

## Capabilities

### New Capabilities
- なし / None.

### Modified Capabilities
- なし / None.

本変更は依存関係の更新・ビルドツールチェーンの整備のみで、ユーザー可視の要件（システム振る舞い）は変更しないため `skip_specs: true` を設定。delta specs は生成しない。

## Impact

- `package.json`: `engines.node` and all dependency/devDependency versions.
- `package-lock.json`: regenerated so transitives resolve to latest compatible versions.
- `ThirdPartyNotices.txt`: regenerated via `scripts/generate-licenses.mjs`.
- Toolchain config (`frontend/vite.config.ts`, tsconfigs, plugin options) may be adjusted only as required by new majors.
- No change to package version (`0.3.5`), CLI behavior, or user-visible product behavior.
