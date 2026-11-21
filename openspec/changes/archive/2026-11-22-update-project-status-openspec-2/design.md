# Design

## Context

- `project-version-status.ts` compares `detectProjectGenerationVersion()` (`metadata.generatedBy`) with the CLI version. 2.1.1 skill files have no `generatedBy`.
- `openspec update --dry-run --json` (2.1.1) returns `{ changes: [{ path, action, tool }], notes: [{ code, message }], failures: [] }`.
- Observed note codes are `global-skills` (machine skills would be refreshed) and `legacy-artifacts`.
- The run writes nothing, and it works in global and project repositories alike.

## Goals / Non-Goals

**Goals:** exact statuses for 2.x with no WebUI-side reimplementation of OpenSpec's comparison, and guidance that matches the machine-wide model.

**Non-Goals:** running real updates from the WebUI; status for unregistered projects.

## Decisions

- **The CLI is the authority.** Use the dry run instead of hashing skill contents ourselves. OpenSpec owns the template contents and the migration rules.
  - Alternative: compare files against the CLI's templates. Rejected, because it is not exposed and would drift.
- **Version gate.** The existing version snapshot provides the CLI major. 2.x and later use the dry run; otherwise, and while the version is unknown, the existing `generatedBy` path is used.
- **Concurrency and timeout.** Run 3 at a time with the existing CLI timeout. Results are cached in the snapshot, so a page view never spawns processes. Only startup and refresh do.
- **Machine status is derived, not probed separately.** Every dry run already evaluates the global skills. Taking the note from any successful run avoids an extra process. With no registered project there is no status, and the row shows `unknown` with the command still available.
- **API shape is additive.**
  - `status` gains `legacy-cleanup`, and entries gain `changedFiles?: number`.
  - The snapshot gains `machineSkills: { status }`.
  - `generationVersion` stays, and is `null` for 2.x.
  - Old clients map unknown statuses to `unknown`.
- **The `.codex` noise** (`Unable to check if directory exists`) can appear on stdout before the JSON. Leading non-JSON stdout lines are skipped; stderr is ignored.

## Risks / Trade-offs

- [Note codes change in a future CLI] → Unknown codes are ignored. Only `changes` decides `update-available`, so the worst case is a missed machine-wide hint.
- [Startup cost with many projects] → Bounded concurrency, and the work runs off the request path.
