# OpenSpec WebUI

<img src="./frontend/public/app-icon.svg" alt="OpenSpec WebUI app icon" width="48" height="48" />

Browser UI for OpenSpec-compatible directories.

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
- Default project path: `./openspec`
- Server code is watched and restarted automatically
- Frontend source changes rebuild `dist-frontend` automatically
- After frontend edits, refresh the browser manually

Open another project:

```bash
npm run dev -- /path/to/project
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

Open another project:

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
- Default project path: `./openspec`

Open another project:

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

## Path behavior

- `npm run dev`, `npm run debug`, and `npm run release` use `./openspec` when no path is given
- If you pass a path, that path is treated as the target OpenSpec project root
- The standalone CLI keeps its original behavior: `openspec-webui [path]` defaults to the current directory

## CLI usage

```bash
openspec-webui [path] [options]
```

### Examples

```bash
openspec-webui .
openspec-webui ./my-project
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
- Render Markdown and HTML artifacts
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

This UI also surfaces extra files under a change and groups them into tabs.

## License

MIT. See [LICENSE](./LICENSE).

This project includes code derived from the MIT-licensed upstream repository `MusicAdam/openspec-viewer`.
