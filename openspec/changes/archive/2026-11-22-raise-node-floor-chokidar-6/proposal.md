## Why

`package.json` declares `engines.node >=20.19.0`, a floor carried over from OpenSpec 1.x. OpenSpec 2.x (`@fission-ai/openspec@2.1.1`), which the WebUI drives, requires Node `>=22.20.0`, so the declared range promises support that the OpenSpec CLI itself does not offer. chokidar 6 needs Node `>=22.22`; raising the floor to that lets us take the upgrade in the same point release (v2.0.1).

## What Changes

- Raise `engines.node` to `>=22.22.0` (package.json and package-lock root).
- Upgrade chokidar 5 → 6 (ESM-only, native recursive `fs.watch` backend on macOS/Windows).
- Handle watcher `error` events so a watch failure is logged instead of crashing the server (chokidar 6 reports `add()` failures as `error` events).
- Update README prerequisites, development requirements and compatibility text.
- CI: replace the Node 20.19 minimum job with exactly `22.22.0`.
- **BREAKING** (correction): Node 20 and Node 22 below 22.22 are no longer supported.

## Capabilities

### New Capabilities

### Modified Capabilities
- `package-distribution` (ADDED requirement): declares the supported Node.js floor explicitly.
- `continuous-integration` (MODIFIED requirement): minimum-version job pins the exact floor.
- `live-refresh` (ADDED requirement): watcher errors are reported, not fatal.

## Impact

package.json, package-lock.json, src/watcher/file-watcher.ts, README.md, .github/workflows/ci.yml. Users on Node < 22.22 must upgrade Node.
