# Design

## Context

See proposal.md for motivation. The CLI (`src/cli/program.ts`) takes `--port <number>` and `--no-open`. `GET /api/version-status` returns a snapshot with `loading` and `tools.openspec` (`currentVersion`, `notInstalled`, `installManager`, ...), populated asynchronously from `openspec version --check --json`. On Windows, `src/server/openspec-cli.ts` first launches `openspec` directly (finds `openspec.exe`) and falls back to `openspec.cmd` with a shell only on `ENOENT`. The server exposes no field saying which strategy was used.

## Goals / Non-Goals

**Goals:**
- Catch test/typecheck/build regressions on Linux and Windows.
- Exercise the packed-and-installed package (not the source tree) against real OpenSpec installs on Windows.

**Non-Goals:**
- Publishing or release automation.
- macOS runners, Playwright e2e tests, a full Node version matrix.

## Decisions

- **Node versions.** Checks use Node `22` (current LTS line; resolves to the newest 22.x). Node `20.19` runs on ubuntu only, as one extra job, to guard the `engines` floor. Smoke jobs use `22` because OpenSpec 2.x from npm requires Node >= 22.20, which the newest 22.x satisfies.
- **Smoke logic in `scripts/ci-smoke.mjs`** rather than inline PowerShell: runnable on any OS, testable locally, and readable. It picks a free port via `net.listen(0)`, starts `openspec-webui --port <p> --no-open` (or `node <bin>` with `--bin` for local runs), polls once a second up to 90s, asserts, and kills the process tree (`taskkill /T /F` on Windows, process-group `SIGTERM` on POSIX).
- **Shim observability.** The API does not report the launch strategy, so the npm job runs with `--expect-shim`: the script asserts `where openspec.exe` finds nothing and `where openspec.cmd` finds the npm shim. Because the direct launch can only resolve an `.exe`/`.com`, a successful version probe under those conditions can only have come from the shim fallback. Alternative considered: adding a debug field to the API. Rejected; it changes runtime behavior just for CI.
- **Standalone install method.** The official method is `irm https://openspec.dev/cli/install.ps1 | iex`, documented in the OpenSpec README (shipped in the npm package, "Quick Start") and at https://openspec.dev/docs/installation. The script is non-interactive: it downloads `openspec-windows-<arch>` from GitHub releases of Fission-AI/OpenSpec, verifies `SHA256SUMS`, and installs to `$env:OPENSPEC_INSTALL_DIR` (default `%LOCALAPPDATA%\Programs\openspec`). It changes only the user PATH in the registry and the current session, so the job sets `OPENSPEC_INSTALL_DIR` under `runner.temp` and appends that directory to `$GITHUB_PATH` for later steps. `openspec install` (CLI subcommand) installs the standalone binary from an existing install; it is not used because it would need npm OpenSpec first. `installManager` is logged, not asserted.
- **Actions** are pinned to major versions (`actions/checkout@v4`, `actions/setup-node@v4`) with `cache: npm`; `permissions: contents: read`; `timeout-minutes: 20` per job; concurrency cancels superseded runs of the same ref.

## Risks / Trade-offs

- [The standalone installer pulls `latest` from an external site] → The job fails loudly with the installer's error message; pinning `OPENSPEC_VERSION` is a one-line fix if upstream breaks.
- [The `--expect-shim` check is indirect evidence] → It relies on Windows direct launch not resolving `.cmd`, which is how `execFile` without a shell behaves; unit tests in `openspec-cli.test.ts` cover the fallback logic itself.
- [Node 20.19 dev dependencies may later drop support] → That job then fails visibly, which is the signal to revisit `engines`.
