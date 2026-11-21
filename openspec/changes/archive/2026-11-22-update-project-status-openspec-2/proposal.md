# Proposal

## Why

The Versions page tells the operator to run `openspec update` in every registered project. It judges each project by reading `metadata.generatedBy` from the project's skill files. OpenSpec 2.x breaks both halves of that.

- **No version stamp.** 2.x skill files no longer carry `metadata.generatedBy`, so every 2.x project shows `unknown`.
- **Global repositories have nothing to read.** A global-scope repository holds no skills at all, and its skills are one machine-wide set.
- **One update covers every global project.** Running `openspec update` in any project refreshes `~/.agents/skills` for all global projects at once. Listing each global project as needing its own update is wrong.

OpenSpec 2.x offers an exact answer instead. `openspec update --dry-run --json` reports:
- project files that would change (`changes`);
- a `global-skills` note when the machine-wide skills would be refreshed;
- a `legacy-artifacts` note when 1.x files remain.

This was verified with 2.1.1 against stale project and stale global skills.

## What Changes

- **Status source.** For a 2.x CLI, project status comes from `openspec update --dry-run --json`, run in each registered project. Runs happen at startup and on manual refresh, with bounded concurrency.
  - The project status is one of: `up-to-date`, `update-available` (with the count of changed files), `legacy-cleanup` (1.x files remain), or `unknown` (the run failed).
  - Global-only repositories no longer show `unknown`. Their status reflects only their own files.
- **Machine-wide status.** A separate status is derived from the `global-skills` note of any run. The Versions page shows it as one row ("Skills on this machine"), with one `openspec update` command.
- **Per-project list.** The list shows `openspec update <path>` only for projects that have project-scope changes or legacy files. A legacy row explains that cleanup needs `openspec update --force` or an interactive confirmation.
- **Guidance and profile wording.**
  - The post-upgrade guidance changes from "run in each project" to two cases: once for machine-wide skills, and per repository only for repositories that keep their own skills.
  - The `openspec config profile` caption says the selection applies on the next `openspec update`. That covers the machine-wide skills and any repository that keeps its own.
- **1.x CLIs** keep the `generatedBy` comparison.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-version-status`: 2.x status from the CLI dry run; machine-wide status.
- `versions-page`: a machine-wide row plus a per-project list limited to repositories that need their own update; new guidance wording.

## Impact

- `src/server/project-version-status.ts`, `skill-scanner.ts` (1.x path kept), the API types and route.
- The Versions section in `SettingsView.svelte`, `versionStatusCore.ts`, the Commands section profile caption, and 7 locale files.
- One extra CLI process per registered project at startup and on refresh.
