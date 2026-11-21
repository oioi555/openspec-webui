## Context

The WebUI's only chokidar use is `src/watcher/file-watcher.ts` (default import, regex `ignored`, `persistent`, `ignoreInitial`, `awaitWriteFinish {100, 50}`, add/change/unlink/addDir/unlinkDir). The project is already ESM. OpenSpec 2.x requires Node >=22.20.0; chokidar 6 requires >=22.22.

## Goals / Non-Goals

**Goals:** align `engines` with the OpenSpec 2.x runtime; adopt chokidar 6; keep live refresh behavior identical.
**Non-Goals:** choosing a non-default chokidar `backend`; changing watch semantics.

## Decisions

- **Floor `>=22.22.0`**: OpenSpec 2.x's floor raised to chokidar 6's. A separate 22.20 floor would block the upgrade for a two-minor gap.
- **Keep options as-is**: none of our options are deprecated in chokidar 6; `awaitWriteFinish` values are valid. Default `backend: 'auto'` is accepted.
- **Add an `error` listener** that logs via `console.warn`: without a listener an EventEmitter `error` throws, and chokidar 6 routes `add()` failures there.
- **Keep the esbuild `.ts` strip in `settings-ssr-loader.mjs`**: Node 22.18+ strips types natively, but only erasable syntax and only when the module reaches Node's default loader; tsx's hook chain and non-erasable syntax make removal not clearly safe. Comment updated only.
- **Keep the `ws` client in integration tests** (per maintainer).

## Risks / Trade-offs

- [Native recursive fs.watch backend on macOS/Windows behaves differently] → Windows CI and the live-refresh check exercise events.
- [Users on Node 20 break] → It is a correction: OpenSpec 2.x already fails there. Called out in release notes.
