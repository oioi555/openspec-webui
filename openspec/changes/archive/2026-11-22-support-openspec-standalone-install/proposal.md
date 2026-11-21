# Proposal

## Why

Since v1.15, OpenSpec's default install is a standalone binary that needs no Node.js:
- `openspec.exe` on Windows;
- an `openspec install` command;
- Homebrew on macOS.

The WebUI does not handle this yet:
- On Windows it always launches npm's `openspec.cmd` shim through a shell. A standalone-only machine therefore reports the CLI as missing.
- The Versions page always offers `npm install -g @fission-ai/openspec@latest` as the update command. That command is wrong for standalone and Homebrew installs.

OpenSpec 2.x's `openspec version --check --json` reports the install manager and the right update command. The WebUI should use it.

## What Changes

- **Windows launch.** Launch `openspec` directly (Windows resolves `openspec.exe`) without a shell. Fall back to the `openspec.cmd` shim through the shell only when the direct launch reports the executable as missing. Cache the working strategy for the process lifetime. The Windows-unsafe argument check stays for the shell path.
- **Install-aware update guidance.** When the CLI supports `openspec version --json`, version status records the install manager and scope. It also records, from the `--check` run, the latest version and the CLI-suggested update command. The Versions page shows that command. If the CLI gives none, the page names the install manager and links the installation docs. npm installs keep `npm install -g @fission-ai/openspec@latest`. Older CLIs keep the current npm-registry path.
- README prerequisites state that OpenSpec 2.x via npm needs Node.js 22.20 or later, while the WebUI itself still runs on Node.js 20.19 or later.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `openspec-cli-invocation`: reach a standalone `openspec.exe` on Windows.
- `versions-page`: the update command follows the detected install method.

## Impact

- `src/server/openspec-cli.ts` and its tests.
- `src/server/version-status.ts`, the API types, `frontend/src/lib/state/versionStatusCore.ts`, the Versions section, and messages.
- `README.md`.
