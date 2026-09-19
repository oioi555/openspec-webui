# Tasks

## 1. Update Dependency Resolution

- [x] 1.1 Install runtime dependencies `@fastify/static@10.1.4`, `@fastify/websocket@11.3.1`, `fastify@5.12.5`, and `open@11.0.4`, and development dependencies `@inlang/paraglide-js@2.25.4`, `@lucide/svelte@1.47.0`, `@types/node@26.6.1`, `shadcn-svelte@1.7.0`, and `svelte@5.57.1`; verify installation succeeds and `package.json` records exactly these direct-version updates in their existing sections.
- [x] 1.2 Review `package-lock.json` and verify its changes are limited to the 9 reviewed direct updates and their compatible transitive resolutions, `devalue` is `>=5.9.2` via `svelte` rather than a new direct dependency or override, and there is no unexplained dependency churn or invalid peer dependencies.
- [x] 1.3 Run `npm outdated --json` and verify TypeScript 7 is the only remaining direct update, then verify TypeScript stays on 6.x and the existing `engines.node`, `packageManager`, and `openspec-webui` version declarations are unchanged.

## 2. Synchronize Generated Notices

- [x] 2.1 Run `node ./scripts/generate-licenses.mjs` after dependency resolution settles and verify `ThirdPartyNotices.txt` contains only license changes attributable to the updated dependency graph.

## 3. Verify Compatibility and Security

- [x] 3.1 Run `npm run typecheck` and verify the TypeScript and Svelte checks complete without errors or warnings.
- [x] 3.2 Run `npm test` and verify the complete server, CLI, parser, and frontend test suite passes.
- [x] 3.3 Run `npm run build` and verify the production package and frontend assets build successfully without unexpected generated-file changes.
- [x] 3.4 Run `npm audit` and verify it reports zero known vulnerabilities.
- [x] 3.5 Run `node ./scripts/verify-release.mjs` and verify the tarball, installed CLI, startup, and packaged API checks pass without changing the package version or publishing artifacts.
- [x] 3.6 Run `openspec validate update-dependencies-2026-09-19 --strict` and verify the completed Change remains valid before archiving.
