# Tasks

## 1. Windows launch

- [x] 1.1 Change `execOpenSpec()` to try a direct `openspec` launch on Windows, fall back to the `openspec.cmd` shim on `ENOENT`, and cache the strategy. Verify with `openspec-cli.test.ts` cases for exe-only, shim-only (fallback, then cached), unsafe arguments on the shim path, and an unchanged POSIX path.

## 2. Install-aware version status

- [x] 2.1 Parse `openspec version --check --json` in `version-status.ts` (install manager, scope, latest, update command), falling back to the existing `--version` + npm-registry path. Verify with tests using captured npm, standalone and malformed JSON.
- [x] 2.2 Expose the fields through the API and types, and show the install-aware update command or the install-docs link on the Versions page, with messages in 7 locales. Verify with `versionStatusCore` and Versions component tests, and `npm run typecheck`.

## 3. Documentation

- [x] 3.1 Update the README prerequisites: WebUI on Node.js ≥ 20.19; OpenSpec 2.x via npm needs Node.js ≥ 22.20; standalone installs need no Node.js. Verify by reading the rendered section.

## 4. Verification

- [x] 4.1 Run `npm test`, `npm run typecheck` and `npm run build`, and verify all pass.
- [x] 4.2 In the dev server on Linux (npm install), verify that the Versions page still shows the npm update command. On Windows, if available, verify that a standalone-only install is detected. Otherwise record this as untested in the archive notes.

## Notes

- 4.2: Checked on Linux (npm install): the Versions page shows `npm install -g @fission-ai/openspec@latest`. A fake CLI also confirmed the standalone command (`openspec install --upgrade`) and the Homebrew docs hint. The Windows standalone-only launch is untested on a real Windows machine; it is covered only by unit tests with a fake launcher.
