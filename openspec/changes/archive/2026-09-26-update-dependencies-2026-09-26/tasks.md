# Tasks

## 1. Update Dependency Resolution

- [x] 1.1 Install development dependencies `@lucide/svelte@1.48.0`, `@sveltejs/vite-plugin-svelte@7.3.1`, `@types/node@26.6.2`, `bits-ui@2.19.3`, `marked@18.0.14`, `tsx@4.23.15`, and `vite@8.3.1`; verify installation succeeds and `package.json` records exactly these direct-version updates in `devDependencies`.
- [x] 1.2 Review `package-lock.json` and verify its changes are limited to the 7 reviewed direct updates and their compatible transitive resolutions, and there is no unexplained dependency churn or invalid peer dependencies.
- [x] 1.3 Run `npm outdated --json` and verify TypeScript 7 is the only remaining direct update, then verify TypeScript stays on 6.x and the existing `engines.node`, `packageManager`, and `openspec-webui` version declarations are unchanged.

## 2. Synchronize Generated Notices

- [x] 2.1 Run `node ./scripts/generate-licenses.mjs` after dependency resolution settles and verify `ThirdPartyNotices.txt` contains only license changes attributable to the updated dependency graph.

## 3. Verify Compatibility and Security

- [x] 3.1 Run `npm run typecheck` and verify the TypeScript and Svelte checks complete without errors or warnings.
- [x] 3.2 Run `npm test` and verify the complete server, CLI, parser, and frontend test suite passes.
- [x] 3.3 Run `npm run build` and verify the production package and frontend assets build successfully without unexpected generated-file changes.
- [x] 3.4 Run `npm audit` and verify it reports zero known vulnerabilities.
- [x] 3.5 Run `node ./scripts/verify-release.mjs` and verify the tarball, installed CLI, startup, and packaged API checks pass without changing the package version or publishing artifacts.
- [x] 3.6 Run `openspec validate update-dependencies-2026-09-26 --strict` and verify the completed Change remains valid before archiving.
