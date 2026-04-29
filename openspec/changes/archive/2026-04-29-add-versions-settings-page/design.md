## Context

The current settings dialog uses a two-column layout with `General`, `Workflow`, and `Commands` categories. That layout has room for one more category, but the existing `General` pane is already dense enough that adding version and update details there would force extra scrolling and bury maintenance information.

At the same time, operators currently have no in-app place to answer basic maintenance questions: which `openspec-webui` version is running, whether a newer WebUI release exists, whether OpenSpec CLI is installed locally, whether that CLI is outdated, and what to do after upgrading it. The OpenSpec docs expose `openspec --version` for the installed CLI version and `openspec update` for refreshing project-generated files after a CLI upgrade, but the WebUI does not surface either workflow today.

## Goals / Non-Goals

**Goals:**
- Add a dedicated `Versions` page in the settings dialog instead of crowding `General`.
- Show installed/current and latest version status for both `openspec-webui` and OpenSpec CLI.
- Show representative update commands using the npm global-install path as the primary example.
- Make update commands easy to copy and link each tool section to its GitHub releases page.
- Remind operators that upgrading OpenSpec CLI requires running `openspec update` in each registered project.
- Show a toast when updates are available, but only once per latest-version snapshot in a browser.

**Non-Goals:**
- Automatically updating either `openspec-webui` or OpenSpec CLI from the UI.
- Executing `openspec update` for projects from the WebUI.
- Exhaustively supporting every package manager or installation method in the initial UI copy.
- Continuously polling for new versions after startup; a startup snapshot is sufficient.
- Detecting whether each individual project has already been refreshed by a post-upgrade `openspec update` run.

## Decisions

### Add `Versions` as a first-class settings category
- **Decision:** Extend the settings sidebar from `General / Workflow / Commands` to `General / Workflow / Commands / Versions`.
- **Rationale:** The user explicitly called out that `General` is already too tight. A dedicated page gives enough space for WebUI + OpenSpec CLI + project guidance without turning version information into hidden footer text.
- **Alternative considered:** Put version text in `General` or a sidebar footer. Rejected because it either overloads the General pane or leaves no room for OpenSpec-specific guidance and project update reminders.

### Build a server-side startup version snapshot
- **Decision:** Resolve version metadata on the server at startup and expose it through a dedicated app-level API payload.
- **Rationale:** The server already owns package metadata, project registry state, and shell access to the local `openspec` binary. Centralizing the lookup avoids duplicated browser logic and keeps all clients on the same snapshot.
- **Alternative considered:** Let each browser query npm directly. Rejected because it duplicates work per client, introduces CORS / network behavior into the frontend, and makes CLI detection impossible without a server round-trip anyway.

### Use package metadata + npm registry + `openspec --version`
- **Decision:**
  - `openspec-webui` current version comes from local package metadata.
  - `openspec-webui` latest version comes from npm registry metadata for `openspec-webui`.
  - OpenSpec CLI installed version comes from `openspec --version`.
  - OpenSpec CLI latest version comes from npm registry metadata for `@fission-ai/openspec`.
- **Rationale:** This matches the current distribution model and the docs the user referenced. It also lets the UI distinguish between “not installed”, “installed but outdated”, and “latest unavailable”.
- **Alternative considered:** Use GitHub releases as the latest-version source. Rejected because the install/update commands in the UI are npm-based, so npm dist-tags are the more relevant source of truth.

### Treat update commands as representative guidance, not universal automation
- **Decision:** Show npm global-install commands as the primary update examples:
  - `npm install -g openspec-webui@latest`
  - `npm install -g @fission-ai/openspec@latest`
  - plus `openspec update` as the required post-upgrade step for each project.
- **Decision:** Each displayed command will have a small copy action so operators can paste it directly into a terminal.
- **Rationale:** The user explicitly chose npm global install as the representative path after reviewing the OpenSpec installation docs. That path is also the least ambiguous in UI copy.
- **Alternative considered:** Show `npm update @fission-ai/openspec` as the primary command because the docs mention it. Rejected because it is less explicit for globally installed CLIs and can imply semver-limited update behavior.

### Link to GitHub releases pages instead of latest-version URLs
- **Decision:** Each tool section in the Versions page will include a stable link to the tool's GitHub releases page rather than linking directly to a latest-release asset or tag.
- **Rationale:** The user wants a fixed link that continues to work over time and lets operators inspect release notes before upgrading.
- **Alternative considered:** Link directly to the latest release or npm package page. Rejected because latest-release links are less stable as a UI contract and npm pages are less useful for reviewing change details.

### Show registered projects as the OpenSpec CLI update checklist
- **Decision:** The Versions page will list currently registered project roots as the set of projects that need `openspec update` after the CLI is upgraded, but it will not try to auto-detect whether the refresh has already been performed.
- **Rationale:** This gives operators a concrete checklist without inventing a brittle “project update state” heuristic.
- **Alternative considered:** Track per-project `openspec update` completion state automatically. Rejected for the first iteration because it would require additional state, detection rules, and edge-case handling across multiple installation/update workflows.

### Deduplicate update toasts per browser using the latest-version snapshot
- **Decision:** Persist the last-notified latest-version snapshot in browser storage and only show the toast when the snapshot changes and at least one tool is outdated.
- **Rationale:** This preserves discoverability without showing the same toast on every page load.
- **Alternative considered:** Always toast when updates exist. Rejected because it would become noisy very quickly.

## Risks / Trade-offs

- **[Risk] npm registry lookup fails or is slow** → **Mitigation:** run lookups without blocking startup completion; expose `unknown` / `unavailable` states instead of failing the app.
- **[Risk] `openspec` is not installed or not on PATH** → **Mitigation:** show an explicit unavailable / not-installed state and still render the recommended install command.
- **[Risk] npm global-install commands are not correct for every user environment** → **Mitigation:** label them as representative / recommended commands and keep the page focused on the primary supported path.
- **[Risk] long project lists make the Versions page visually heavy** → **Mitigation:** render registered projects as a compact reference list rather than a large card per project.
- **[Risk] command text and external links crowd the page** → **Mitigation:** keep commands in compact read-only rows with small copy buttons and use a single release-link action per tool section.

## Migration Plan

1. Add a server-side version snapshot service and app-level API endpoint.
2. Extend the settings dialog navigation to include `Versions`.
3. Render the WebUI / OpenSpec CLI version panels and project update guidance.
4. Add browser-side toast deduplication keyed by the latest-version snapshot.
5. Verify behavior when npm is unreachable and when OpenSpec CLI is missing.

No persistent data migration is required beyond additive browser storage for toast deduplication.

## Open Questions

- None for the initial proposal scope.
