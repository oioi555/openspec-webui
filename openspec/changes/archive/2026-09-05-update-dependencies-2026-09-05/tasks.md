## 1. Update Dependency Resolution

- [x] 1.1 Install runtime dependencies `fastify@5.12.3` and `open@11.0.2`, and development dependencies `@inlang/plugin-message-format@4.4.4`, `@lucide/svelte@1.41.0`, `@types/node@26.4.1`, `generate-license-file@4.2.5`, `shadcn-svelte@1.6.1`, `svelte@5.57.0`, and `tsx@4.23.13`; verify `package.json` records exactly these direct-version updates and installation completes successfully.
- [x] 1.2 Review `package-lock.json` and verify its changes are limited to the nine reviewed direct updates and their compatible transitive resolutions, with no unexplained dependency churn.
- [x] 1.3 Run `npm ls fast-uri --all` and verify vulnerable `fast-uri` versions 3.1.5 and 4.1.2 are absent; if compatible resolution does not remove them, refresh only the affected lockfile entries and verify no `overrides` entry is introduced.
- [x] 1.4 Verify TypeScript remains on the 6.x line and the existing `engines.node`, `packageManager`, and `openspec-webui` package version declarations are unchanged from the pre-Change baseline.

## 2. Synchronize Generated Notices

- [x] 2.1 Run `node ./scripts/generate-licenses.mjs` after dependency resolution settles and verify `ThirdPartyNotices.txt` contains only license changes attributable to the updated dependency graph.

## 3. Verify Compatibility and Security

- [x] 3.1 Run `npm run typecheck` and verify the TypeScript and Svelte checks complete without errors.
- [x] 3.2 Run `npm test` and verify the complete server, CLI, parser, and frontend test suite passes.
- [x] 3.3 Run `npm run build` and verify the production package and frontend assets build successfully without unexpected generated-file changes.
- [x] 3.4 Run `npm audit` and verify it reports zero known vulnerabilities, including no remaining `fast-uri` advisory.
- [x] 3.5 Run `node ./scripts/verify-release.mjs` and verify the repository release checks pass without changing the package version or publishing artifacts.
- [x] 3.6 Run `openspec validate update-dependencies-2026-09-05 --strict` and verify the completed Change remains valid before archiving.
