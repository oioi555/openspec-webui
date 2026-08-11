## 1. Dependency declaration updates

- [x] 1.1 Query `npm view <pkg> version` at implementation time and update every **direct dependency** in `package.json` to latest stable (majors included): `@fastify/static` → 10.1.3, `@fastify/websocket` → 11.3.0, chokidar → 5.0.0, commander → 15.0.0, fastify → 5.11.3, open → 11.0.0, yaml → 2.9.0.
- [x] 1.2 Update every **devDependency** to latest stable (majors included): `@sveltejs/vite-plugin-svelte` → 7.3.0, `@types/node` → 26.2.0, marked → 18.0.9, vite → 8.2.1, plus in-range updates (`@inlang/paraglide-js` 2.23.2, `@inlang/plugin-message-format` 4.4.1, `@lucide/svelte` 1.31.0, `@tailwindcss/typography` 0.5.20, `@tailwindcss/vite` 4.3.3, `@types/ws` 8.18.1, bits-ui 2.18.1, clsx 2.1.1, generate-license-file 4.2.1, shadcn-svelte 1.5.0, svelte 5.56.8, svelte-check 4.7.5, svelte-sonner 1.1.1, tailwind-merge 3.6.0, tailwindcss 4.3.3, tailwindcss-animate 1.0.7, tsx 4.23.12). **Note:** `typescript` is pinned to latest 6.x (`^6.0.3`) instead of TS 7.0.2 because `svelte-check@4.7.5` (latest) peer-restricts TypeScript to `^5.0.0 || ^6.0.0`; TS 7 is not yet supported by the typecheck toolchain.
- [x] 1.3 Set `engines.node` to `>=20.19.0` (exact match with current OpenSpec CLI minimum; satisfies Vite 8 and `@sveltejs/vite-plugin-svelte` 7). Also bumped `packageManager` from `npm@11.13.0` to `npm@11.19.0` (latest stable npm 11; engines `^20.17.0 || >=22.9.0` satisfied by the Node floor).
- [x] 1.4 Run `npm install` to regenerate `package-lock.json`; confirmed it resolves latest compatible transitives (tar 7.5.22, undici 6.28.0, postcss 8.5.26, js-yaml 4.3.1, nanoid 3.3.18, brace-expansion 5.0.9, ip-address 10.5.0, fast-uri 3.1.5/4.1.2, find-my-way 9.7.0, ws 8.21.3, sigstore 4.1.1, esbuild 0.28.2). Fresh install from wiped `node_modules`; lockfile has no `overrides`/force entries.
- [x] 1.5 `npm audit` reports **0 vulnerabilities** (baseline was 16). No `npm audit fix --force` used. The `EALLOWREMOTE` error for `@tailwindcss/oxide-wasm32-wasi` was diagnosed as an environment/npm-config artifact of the old tree; a clean explicit reinstall resolved it (`@tailwindcss/oxide-wasm32-wasi` 4.3.3 installed) with no repo `.npmrc` hacks.
- [x] 1.6 Regenerated `ThirdPartyNotices.txt` via `node ./scripts/generate-licenses.mjs`.

## 2. Compatibility and config changes

- [x] 2.1 `@fastify/static` 10.1.3: confirmed no `setHeaders` option is used (`src/server/index.ts`); static serving verified at runtime (index, SPA route, static asset all served; API 404 intact).
- [x] 2.2 Vite 8 + `@sveltejs/vite-plugin-svelte` 7: updated `frontend/vite.config.ts` to use `import.meta.dirname` instead of `__dirname` (Vite 8 native config-loader compatibility). Build passes.
- [x] 2.3 TypeScript 6.x: fixed typecheck by adding `"vite/client"` to `frontend/tsconfig.json` `types` (TS 6 stricter side-effect `./app.css` resolution) and removed deprecated `baseUrl` (paths are relative and unaffected).
- [x] 2.4 Svelte 5 / svelte-check / marked 18 / `@types/node` 26: no API changes required in `frontend/src/lib/markdown.ts`, `src/watcher/file-watcher.ts`, or `src/cli/index.ts`; verified by typecheck + tests + runtime smokes.
- [x] 2.5 `package.json` `version` remains `0.3.5`.

## 3. Verification

- [x] 3.1 `npm audit` — **0 vulnerabilities** (1 critical / 12 high / 2 moderate / 1 low baseline resolved).
- [x] 3.2 `npm run typecheck` — `tsc --noEmit` + `svelte-check`: **0 errors, 0 warnings**.
- [x] 3.3 `npm test` — **665 passed, 0 failed**.
- [x] 3.4 `npm run build` — clean-dist + i18n + tsc + `vite build` (Vite 8.2.1): succeeded, `dist-frontend/` produced (13 files incl. `index.html` + hashed assets).
- [x] 3.5 `node ./scripts/verify-release.mjs` — passed: `npm pack --dry-run` tarball assertions, `openspec-webui-0.3.5.tgz`, packed CLI `--help`/`--version` and `--no-open --port 0` startup. **Note:** must run under pinned npm 11.19.0 (`npx --yes -p npm@11.19.0 node ./scripts/verify-release.mjs`); system npm 12 changed `npm pack --json` output from array to object, which `parsePackJson` does not accept.
- [x] 3.6 Focused runtime smoke — server/static SPA: CLI `--no-open --port 3111`; `GET /` 200 text/html, `GET /changes` (SPA fallback) 200 identical to index, `GET /favicon.ico` 200, `GET /api/nonexistent` 404.
- [x] 3.7 Focused runtime smoke — watcher: `createFileWatcher` (chokidar 5) emitted `add:changes`, `change:specs`, `change:project` events; non-`.md` file correctly ignored.
- [x] 3.8 Focused runtime smoke — CLI open suppression: ran with `--no-open`; confirmed **no browser process (`xdg-open`/`gio`) spawned** during startup/serving.
- [x] 3.9 Focused runtime smoke — markdown rendering: `renderMarkdown` (marked 18) produced h1/strong/code/list/blockquote HTML; `highlightDeltas` applied `diff-added` classes. Existing `frontend/src/lib/markdown.test.ts` also passed.
- [x] 3.10 `package-lock.json` resolves latest compatible transitives (see 1.4) and `ThirdPartyNotices.txt` regenerated; `git diff` reviewed — only `package.json`, `package-lock.json`, `ThirdPartyNotices.txt`, `frontend/tsconfig.json`, `frontend/vite.config.ts` changed.
