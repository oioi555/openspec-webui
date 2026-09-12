## Why

On Windows, every OpenSpec CLI call uses `execFile('openspec', …)` without a shell. Node cannot launch npm's extensionless shim or `.cmd` shim that way (`ENOENT` / `EINVAL`), so a globally installed CLI is reported as missing. GitHub issue [#1](https://github.com/oioi555/openspec-webui/issues/1) documents this with a working local patch; Windows users currently cannot use Versions, Expanded Commands, Store discovery, or validation.

## What Changes

- Introduce a single OpenSpec CLI spawn helper used by every current call site (version lookup, config/workflows, store list, validation).
- On Windows, target `openspec.cmd` with `shell: true` so npm global installs are reachable; keep POSIX `execFile('openspec', argv)` unchanged.
- Reject arguments that contain `"`, `%`, or control characters before they reach `cmd.exe`, instead of inventing a quoting scheme for those characters.
- Cover the helper with unit tests that run on Linux by injecting platform and `execFile`, so this machine can verify the contract without a Windows host.

## Capabilities

### New Capabilities

- `openspec-cli-invocation`: Shared contract for launching the OpenSpec CLI so a normal npm global install is usable on Windows, macOS, and Linux.

### Modified Capabilities

- (none) Existing Versions, command-availability, Store discovery, and validation requirements already assume a working CLI when it is installed. This change makes that assumption true on Windows rather than changing those product rules.

## Impact

- Server call sites in `src/server/version-status.ts`, `src/server/openspec-config.ts`, `src/server/store-discovery.ts`, and `src/server/routes/api.ts`.
- New helper module plus unit tests; existing injectable `exec` / config-reader seams stay intact.
- No public HTTP API shape change, no new runtime dependencies, no POSIX behavior change.
- Real Windows process spawning cannot be reproduced on Linux; GitHub Actions `windows-latest` or reporter verification remains the OS-level check.
