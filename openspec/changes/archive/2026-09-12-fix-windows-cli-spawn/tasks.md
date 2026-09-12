## 1. Spawn helper

- [x] 1.1 Add `src/server/openspec-cli.ts` that launches OpenSpec via injectable `execFile` and platform: POSIX uses `openspec` without a shell; `win32` uses `openspec.cmd` with `shell: true` and double-quoted args, and rejects `"`, `%`, or control characters before calling `exec`. Verify the exported function exists and TypeScript accepts the module.
- [x] 1.2 Add `src/server/openspec-cli.test.ts` covering POSIX argv, Windows `.cmd` + `shell: true` + quoting, rejection that never calls `exec`, and ordinary subcommand/flag/integer args. Register the file in `scripts/test.mjs` and verify `npm test` passes those cases on Linux.

## 2. Call sites

- [x] 2.1 Switch `readOpenSpecVersion` in `src/server/version-status.ts` to the helper and verify `src/server/version-status.test.ts` still passes, including the ENOENT not-installed path.
- [x] 2.2 Switch `readOpenSpecConfigValue` in `src/server/openspec-config.ts` to the helper and verify `src/server/openspec-config.test.ts` still passes with the existing reader seam.
- [x] 2.3 Switch Store discovery's production `exec` default to the helper (keep the injectable `deps.exec` seam) and verify `src/server/store-discovery.test.ts` still passes, including ENOENT and timeout classification.
- [x] 2.4 Switch `execValidate` in `src/server/routes/api.ts` to the helper without changing `buildValidationCommandString`, and verify `src/server/routes/api.test.ts` still passes.

## 3. Check

- [x] 3.1 Run `npm test` and `npm run typecheck` and verify both succeed with no remaining direct `execFile('openspec', …)` call sites under `src/`.
