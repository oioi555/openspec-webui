# Tasks

## 1. Smoke script

- [x] 1.1 Add `scripts/ci-smoke.mjs` (free port, start server with `--no-open`, poll `/api/version-status` until `loading` is false, assert `notInstalled`/semver/`installManager`, optional `--expect-shim` PATH check, kill process tree); verify with `node scripts/ci-smoke.mjs --bin bin/openspec-webui.js --expect-manager npm` passing locally
- [x] 1.2 Verify the global-command path by installing an `npm pack` tarball into a scratch prefix and running `node scripts/ci-smoke.mjs --expect-manager npm`; confirm no server process is left running

## 2. Workflow

- [x] 2.1 Add `.github/workflows/ci.yml` with the checks matrix (ubuntu/windows on Node 22, ubuntu on Node 20.19), `contents: read`, timeouts, npm cache; verify with actionlint
- [x] 2.2 Add the Windows npm smoke job (`npm i -g @fission-ai/openspec@latest`, pack + global install, `--expect-manager npm --expect-shim`); verify with actionlint
- [x] 2.3 Add the Windows standalone smoke job using the official `install.ps1` with `OPENSPEC_INSTALL_DIR` and `$GITHUB_PATH`; verify with actionlint
- [x] 2.4 Re-include `.github/workflows/` in `.gitignore` (which ignores `.github/` as local AI tooling); verify `git status` lists `.github/workflows/ci.yml`

## 3. Local verification

- [x] 3.1 Run `npm test`, `npm run typecheck`, `npm run build` locally; all pass
- [x] 3.2 Run `openspec validate add-ci-workflow --strict` and the requirement length check; both pass

## 4. Fixes from the first GitHub run

- [x] 4.1 Run repo-local dev tools through `process.execPath` + the package's JS `bin` entry instead of `node_modules/.bin/*.cmd` (Windows `spawn EINVAL`, CVE-2024-27980); same for npm and the packed CLI in `verify-release.mjs`; verify `npm test`/`npm run build`/`npm run dev` on Linux
- [x] 4.2 Use the `ws` client in `server.integration.test.ts` (Node 20 has no global `WebSocket`) and close the server even when the first WebSocket client fails to connect; verify the file passes on Node 20.19
- [x] 4.3 Strip plain `.ts` modules in `settings-ssr-loader.mjs` (Node 20 lacks native type stripping); verify `npm test` passes on Node 20.19
- [x] 4.4 Pass `--test-timeout=60000` from `scripts/test.mjs` so a hung test fails fast
- [x] 4.5 Make the suite run on Windows: fake `openspec` gets an `openspec.cmd` shim and PATH uses `path.delimiter`; `.gitattributes` forces LF checkout; store-root and global-skill path expectations follow Windows paths; verify `checks (windows-latest, node 22)` is green

## 5. GitHub

- [x] 5.1 Push and confirm a green run on GitHub (all jobs, including both Windows smoke jobs)

## Notes

- The shim-fallback check can only be proven on a real Windows runner.
