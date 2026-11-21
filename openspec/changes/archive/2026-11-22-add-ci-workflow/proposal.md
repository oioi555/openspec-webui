# Proposal

## Why

The repository has no CI, so regressions in tests, type checks, the build, or the Windows-specific OpenSpec CLI launch path (direct `openspec.exe` vs. npm's `openspec.cmd` shim) are only caught by hand. Windows support for both npm and standalone OpenSpec installs was added recently and has no automated coverage.

## What Changes

- Add `.github/workflows/ci.yml` running on push to `main` and on pull requests, with minimal `contents: read` permissions and per-job timeouts.
- Checks job: `npm ci`, `npm test`, `npm run typecheck`, `npm run build` on ubuntu-latest and windows-latest with Node 22, plus Node 20.19 (the `engines` minimum) on ubuntu only.
- Windows smoke job with OpenSpec installed from npm: pack this repo, install the tarball globally, start `openspec-webui`, and assert `/api/version-status` reports a working npm-installed CLI reached via the `openspec.cmd` shim.
- Windows smoke job with OpenSpec installed by the official standalone installer (`install.ps1`), asserting the same CLI detection.
- Add `scripts/ci-smoke.mjs`, a cross-platform Node script that starts the server on a free port, polls, asserts, and stops it.

## Capabilities

### New Capabilities
- `continuous-integration`: automated verification that runs on every push to `main` and every pull request, including packaged-install smoke tests on Windows.

### Modified Capabilities

## Impact

- New files: `.github/workflows/ci.yml`, `scripts/ci-smoke.mjs`; `.gitignore` re-includes `.github/workflows/`. No runtime code or published package contents change (`scripts/` is not in `files`).
- Depends on GitHub-hosted runners, the npm registry, and `https://openspec.dev/cli/install.ps1` with GitHub releases of Fission-AI/OpenSpec.
