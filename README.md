# OpenSpec WebUI

<img src="./frontend/public/app-icon.svg" alt="OpenSpec WebUI app icon" width="48" height="48" />

Browser UI for OpenSpec projects with server-side project selection.

This repository started from the MIT-licensed `MusicAdam/openspec-viewer` project and is being reshaped into a more general local-first UI for browsing specs, changes, and review workflows.

The shared `app-icon.svg` is used for the navigation home affordance, browser favicon, and repository documentation.

## Requirements

- Node.js >= 20

## The 3 workflows

Everything should fit into one of these.

### 1. Development

Use this for normal feature work.

```bash
npm run setup
npm run dev
```

- App URL: `http://127.0.0.1:3001`
- Default bootstrap project in wrapper scripts: this repository root
- Server code is watched and restarted automatically
- Frontend source changes rebuild `dist-frontend` automatically
- After frontend edits, refresh the browser manually

Bootstrap another project:

```bash
npm run dev -- /path/to/project
```

or:

```bash
OPENSPEC_INITIAL_PROJECT=/path/to/project npm run dev
```

### 2. Debug

Use this when you want breakpoints and stack traces.

```bash
npm run setup
npm run debug
```

- App URL: `http://127.0.0.1:3001`
- Node inspector: `ws://127.0.0.1:9229`
- Frontend assets are rebuilt with sourcemaps

Bootstrap another project:

```bash
npm run debug -- /path/to/project
```

### 3. Release

Use this to verify the production build locally.

```bash
npm run setup
npm run release
```

- Builds server + frontend production assets
- Starts the built app on `http://127.0.0.1:3001`
- Default bootstrap project in wrapper scripts: this repository root

Bootstrap another project:

```bash
npm run release -- /path/to/project
```

## Supporting commands

| Command | Use |
|--------|-----|
| `npm run setup` | Install all required dependencies, including devDependencies |
| `npm run doctor` | Check local tooling and current defaults |
| `npm run typecheck` | Run TypeScript + Svelte diagnostics |
| `npm run build` | Build production assets without starting the app |
| `npm start` | Start the already-built app |

## Project bootstrap and selection

- `openspec-webui` no longer accepts a positional project path
- Use `OPENSPEC_INITIAL_PROJECT=/path/to/repo openspec-webui` to pre-load an initial project at startup
- Wrapper scripts (`npm run dev`, `npm run debug`, `npm run release`, `npm start`, `npm run dev:server`) map their first positional argument to `OPENSPEC_INITIAL_PROJECT`
- If wrapper scripts are started without a project argument and `OPENSPEC_INITIAL_PROJECT` is unset, they bootstrap this repository root for local development ergonomics
- After startup, add/switch/remove projects from the Project Selector UI
- Project registry state is persisted in `${XDG_CONFIG_HOME:-~/.config}/openspec-webui/projects.json`

## CLI usage

```bash
openspec-webui [options]
```

### Examples

```bash
openspec-webui
OPENSPEC_INITIAL_PROJECT=./my-project openspec-webui
openspec-webui --port 8080
openspec-webui --no-open
```

### Options

| Option | Description |
|--------|-------------|
| `-p, --port <port>` | Port to run the server on (default: 3001) |
| `--no-open` | Do not open the browser automatically |
| `-V, --version` | Display version |
| `-h, --help` | Display help |

## What it does today

- Browse `project.md`, `specs/`, active changes, and archived changes
- Render Markdown artifacts
- Track checkbox task progress
- Search across supported OpenSpec content
- Watch files and refresh the UI when content changes
- Group supplemental change files by folder/tab
- Reuse a shared app icon across the navigation, favicon, and docs

## OpenSpec layout

[OpenSpec](https://github.com/Fission-AI/OpenSpec) is a spec-driven workflow built around directories like:

- `project.md`
- `specs/`
- `changes/` with `proposal.md`, `tasks.md`, `design.md`
- `changes/archive/`

This UI also surfaces extra Markdown files under a change and groups them into tabs.

## License

MIT. See [LICENSE](./LICENSE).

This project includes code derived from the MIT-licensed upstream repository `MusicAdam/openspec-viewer`.
