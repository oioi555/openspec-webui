## Implementation Phases

### Phase 1: Registry core + tests
- Tasks: 1.1–1.6
- Goal: project registry, persistence, active session core, and unit-test coverage without changing server startup or routes yet

### Phase 2: Server route/session integration
- Tasks: 2.1–2.7, 3.1
- Goal: add project CRUD routes and convert existing API routes to the mutable active-project session
- Guardrail: implement 2.1–2.4 first, then land 2.5 and 2.6 together so existing APIs are not left half-migrated

### Phase 3: CLI, scripts, and docs migration
- Tasks: 3.2, 3.4–3.8
- Goal: move project bootstrap to `OPENSPEC_INITIAL_PROJECT`, keep `npm run dev` / `debug` / `release` usable, and update operator-facing docs in the same phase
- Guardrail: do not split CLI argument removal from the wrapper script updates

### Phase 4: WebSocket protocol integration
- Tasks: 3.3
- Goal: add `project:switched` and `connection:init` on the server/shared protocol before frontend subscribers rely on them

### Phase 5: Frontend API/store integration
- Tasks: 4.1–4.3, 5.1–5.5, 8.1
- Goal: add project-aware API helpers, stores, reset/reconnect behavior, and graceful `NO_ACTIVE_PROJECT` handling before UI surfaces are wired up

### Phase 6: Frontend UI surfaces
- Tasks: 6.1–6.4, 7.1–7.2
- Goal: ship the ProjectSelector dialog, ActivityBar integration, and empty state on top of the project-aware data layer

### Phase 7: Validation and end-to-end verification
- Tasks: 8.2–8.5
- Goal: lock in regression coverage for registry behavior, websocket sync, script workflows, and multi-project live refresh

## 1. Server: Project Registry Core

- [x] 1.1 Create `src/server/project-registry.ts` with a versioned registry schema, ProjectEntry type (id, path, label, addedAt, lastOpenedAt), project-root path normalization, XDG-aware config path resolution, load/save functions for `${XDG_CONFIG_HOME:-~/.config}/openspec-webui/projects.json`, config directory auto-creation, atomic writes, and in-memory registry state
- [x] 1.2 Implement `addProject(path)`: validate path exists + contains `openspec/` directory, normalize path, generate UUID, derive label from directory name, prevent duplicates by reusing the existing entry, persist to file, and report whether the path was newly created or reactivated
- [x] 1.3 Implement `removeProject(id)`: remove from registry, fall back active to first remaining or null, persist, and report whether the active project changed
- [x] 1.4 Implement active-project session helpers (`activateProject(id)` / `clearActiveProject()`): use a shared registry/session mutation lock, parse/prepare the target project before committing the switch, atomically replace the active root/path/data/watcher only after success, clear project-scoped caches (including command availability), persist, and roll back to the previous session on failure
- [x] 1.5 Implement `listProjects()`, `getActiveProject()`, `getActiveProjectRoot()`, `getActiveOpenSpecPath()`, and `getActiveData()` read operations with explicit separation between project root and `openspec/` directory
- [x] 1.6 Write unit tests for project-registry/session helpers (add, remove, activate, duplicate path reactivation, missing config dir, JSON corruption recovery, invalid saved paths, watcher replacement, cache reset, activation rollback, atomic write)

## 2. Server: API Routes

- [x] 2.1 Add `POST /api/projects` route: call add/reactivate logic, return 201 with entry for a new project, return 200 with the existing entry when the path already exists, or 400 with error for invalid paths
- [x] 2.2 Add `GET /api/projects` route: return list with activeProjectId
- [x] 2.3 Add `DELETE /api/projects/:id` route: call `removeProject`, return 200 or 404, and emit `project:switched` when the active project changes
- [x] 2.4 Add `POST /api/projects/:id/activate` route: call `activateProject`, broadcast WebSocket `project:switched`, return 200 or 404
- [x] 2.5 Refactor `registerApiRoutes` in `src/server/routes/api.ts` to consume mutable active-project getters / session hooks instead of a fixed startup `openspecPath`
- [x] 2.6 Modify existing API routes (`/api/project`, `/api/specs`, `/api/changes`, `/api/stats`, `/api/search`, `/api/commands/availability`) to read from the active project context; return 503 when no active project exists for project/spec/change/stats/search data, use `getActiveProjectRoot()` for command availability, and never serve stale command-availability results after a switch or removal
- [x] 2.7 Add a shared structured API error shape (`code`, `error`, optional metadata) for invalid path, no active project, activation failure, and not-found cases so frontend recovery paths can branch safely

## 3. Server: Startup, WebSocket & CLI Integration

- [x] 3.1 Modify `createServer` in `src/server/index.ts` to initialize the project registry at startup, load from `projects.json`, validate persisted entries, restore the active project if one exists, keep the current watcher reference mutable, and ensure `server.close()` stops whichever watcher is currently active; finish restore/bootstrap before listen so post-start 503 means `NO_ACTIVE_PROJECT` rather than `still loading`
- [x] 3.2 Add `OPENSPEC_INITIAL_PROJECT` environment variable support in startup: validate the path, add or reactivate it if valid, warn and continue if invalid
- [x] 3.3 Extend WebSocket message types (`src/shared/types.ts`, `frontend/src/lib/websocket.ts`) and server broadcasts to include `project:switched` and `connection:init` with `activeProjectId`
- [x] 3.4 Remove `[path]` CLI argument from `src/cli/index.ts`, keep `--port` / `--no-open`, and switch startup validation from positional path checks to registry/bootstrap logic
- [x] 3.5 Update helper scripts (`scripts/dev-utils.mjs`, `scripts/start.mjs`, `scripts/dev.mjs`, `scripts/run-dev-server.mjs`, `scripts/release.mjs`, `scripts/debug.mjs`) to stop auto-injecting a default positional project path and instead map script-level project arguments onto `OPENSPEC_INITIAL_PROJECT`
- [x] 3.6 Preserve local developer ergonomics: decide and implement the default `OPENSPEC_INITIAL_PROJECT` behavior for `npm run dev` / `npm run debug` / `npm run release`, and update `scripts/doctor-dev.mjs` guidance accordingly
- [x] 3.7 Update docs and metadata (`README.md`, `package.json` descriptions/help text if needed) to remove outdated path-based startup instructions and describe the new project-selection/bootstrap model
- [x] 3.8 Explicitly audit `scripts/run-dev-frontend.mjs`, `scripts/run-local-bin.mjs`, and `scripts/test-tabbar-ui.mjs` as unchanged-by-design so the migration does not accidentally broaden scope later

## 4. Frontend: API Client & Types

- [x] 4.1 Add `ProjectEntry`, `ProjectListResponse`, and structured API error support (status + message) to `frontend/src/lib/api.ts`
- [x] 4.2 Add API functions: `getProjects()`, `addProject(path)`, `removeProject(id)`, `activateProject(id)`
- [x] 4.3 Update existing API helpers so `initializeData()` and related flows can distinguish `503 no active project`, `activation failure`, and generic server errors from one another

## 5. Frontend: Project Store & Switch Reset

- [x] 5.1 Create `frontend/src/stores/projects.svelte.ts` with Svelte 5 runes: projects list, activeProjectId, loading state, error state
- [x] 5.2 Implement `loadProjects()` to fetch from `/api/projects` and update state
- [x] 5.3 Implement `addProject(path)`, `removeProject(id)`, `switchProject(id)` store actions with API calls and duplicate-path reactivation handling
- [x] 5.4 Handle WebSocket `project:switched` event in the existing WebSocket subscriber: close the selector dialog, call `initializeData()`, refresh command availability for the new active project, clear project-scoped search state, and reset tabs to Dashboard via `tabStore.closeAll()`
- [x] 5.5 Handle `connection:init` during WebSocket connect/reconnect: compare `activeProjectId`, and if the client is out of sync, reinitialize all project-scoped state before processing incremental refreshes

## 6. Frontend: ProjectSelector UI

- [x] 6.1 Create `frontend/src/components/layout/ProjectSelector.svelte` dialog content component: project list, active indicator, path input with add button, inline errors, and remove button with confirmation
- [x] 6.2 Integrate ProjectSelector into the existing `Dialog.Root` slot in `AppLayout.svelte`: render when `layoutStore.overlay === 'project-selector'`
- [x] 6.3 Handle switch flow: on project select → close dialog → show loading → call `switchProject(id)` → stores reset
- [x] 6.4 Update the ActivityBar project button highlight / tooltip so the selector control reflects the active project and the open dialog state

## 7. Frontend: Empty State

- [x] 7.1 Create `frontend/src/components/EmptyProjectState.svelte`: message + path input + add button, displayed when projects list is empty
- [x] 7.2 Integrate empty state into AppLayout/MainViewer: show when `activeProjectId` is null, hide Explorer Pane, and avoid rendering the Dashboard surface without an active project

## 8. Validation & Tests

- [x] 8.1 Update `initializeData()` in `frontend/src/stores/index.svelte.ts` to treat 503 responses as "no active project" instead of a fatal workspace error
- [x] 8.2 Add server integration tests for `/api/projects` CRUD, duplicate-path 200 behavior, active-project routing, `OPENSPEC_INITIAL_PROJECT`, stale command-availability invalidation, persisted invalid-path cleanup, and activation rollback on parse failure
- [x] 8.3 Add WebSocket / frontend tests for `project:switched`, `connection:init`, tab reset to Dashboard, and command-availability refresh after project changes
- [x] 8.4 Update script-based verification (`scripts/verify-ui.mjs`) to resolve the active project's `project.md` dynamically via `GET /api/projects`, then verify multi-project-safe live refresh behavior
- [x] 8.5 Verify Explorer Pane header, ActivityBar tooltip, WebSocket reconnection, and `npm run dev` / `npm run debug` / `npm start` preserve the correct active-project context across switch/remove flows
