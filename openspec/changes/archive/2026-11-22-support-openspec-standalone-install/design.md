# Design

## Context

- `execOpenSpec()` hard-codes `openspec.cmd` + `shell: true` on Windows.
- `version-status.ts` reads `openspec --version` and the npm registry.
- OpenSpec 2.1.1 `version --check --json` returns `{ version, install: { location, packageManager, scope }, update: { status, latest, command, canSelfUpgrade } }`. On an npm install, `command` was `null` while the status was current.

## Goals / Non-Goals

**Goals:** standalone and Homebrew users get a working CLI and a correct update hint.

**Non-Goals:** running upgrades from the WebUI; changing the WebUI's own npm update hint.

## Decisions

- **Direct first, shim second.** Node's `execFile('openspec')` on Windows resolves `openspec.exe` through `CreateProcess` without a shell, so no new quoting is needed. Only `ENOENT` triggers the fallback. A module-level cached strategy (`'direct' | 'shim'`) avoids paying a failed spawn on every call, and tests reset it through the existing `platform` / `exec` seams.
  - Alternative: probe PATH with `where openspec`. Rejected, because it adds a process and duplicates resolution logic.
- **`version --check --json` as the source.** It also tells us the latest version, so the npm registry fetch is skipped when the CLI answers. The registry fetch stays as the fallback for CLIs without `version --json`, which exit non-zero or print non-JSON. The check needs the network, so it runs with the existing startup and refresh timing. Its timeout is 5 s rather than the 3 s registry lookup timeout, because it also includes CLI startup. On older CLIs, the `--version` fallback starts only after this check fails.
- **Unknown fields degrade.** An unrecognised `packageManager` is shown verbatim next to the docs link. It is never mapped to a guessed command.

## Risks / Trade-offs

- [A standalone `update.command` value differs from the assumed `openspec install`] → The UI shows whatever the CLI returns, and tests use captured JSON.
- [Windows behavior cannot be exercised on Linux CI] → Unit-test the strategy through the injected `exec` and `platform`, and list a manual Windows check in tasks.
