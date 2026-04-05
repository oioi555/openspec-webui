# OpenSpec WebUI

Local-first browser UI for exploring, reviewing, and iterating on OpenSpec-compatible directories.

## Product Intent

- Browse `project.md`, current specs, active changes, and archived changes from one local interface.
- Surface task progress, spec deltas, rendered artifacts, and supplemental change files without leaving the browser UI.
- Support search, live refresh, theming, and review handoff workflows for local OpenSpec work.

## Technology Stack

- Node.js 20+
- TypeScript
- Fastify
- Svelte 5
- Vite
- chokidar

## Repository Conventions

- `src/` contains CLI, server, parser, shared types, and watcher logic.
- `frontend/` contains the Svelte application, UI components, and static browser assets.
- `openspec/` stores project context, main specs, active changes, and archived change history.
- User-visible behavior changes should be captured in OpenSpec before or alongside implementation when practical.
- The app is local-first and defaults to serving on `127.0.0.1`.
