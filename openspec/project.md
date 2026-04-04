# OpenSpec WebUI

Local-first browser UI for exploring and reviewing OpenSpec-compatible directories.

## Product Intent

- Browse `project.md`, current specs, active changes, and archived changes from one local interface.
- Surface task progress, spec deltas, and supplemental change artifacts without leaving the browser UI.
- Support review handoff with local suggestions and clipboard-ready implementation instructions.

## Technology Stack

- Node.js 20+
- TypeScript
- Fastify
- Svelte 5
- Vite
- chokidar

## Repository Conventions

- `src/` contains CLI, server, parser, shared types, and watcher logic.
- `frontend/` contains the Svelte application and UI components.
- `openspec/` stores project context, main specs, active changes, and archived change history.
- User-visible behavior changes should be captured in OpenSpec before or alongside implementation when practical.
- The app is local-first and defaults to serving on `127.0.0.1`.
