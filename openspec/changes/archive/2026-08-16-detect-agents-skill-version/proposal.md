## Why

Projects that enable only Codex store OpenSpec skills under `.agents/skills`, but the project version scanner does not inspect that standard root. As a result, valid `metadata.generatedBy` markers are ignored and the settings view reports the project version as unknown.

## What Changes

- Include `.agents/skills` when detecting the OpenSpec generation version of a registered project.
- Preserve the existing read-only, first-readable-marker detection behavior across all supported skill roots.
- Add regression coverage for projects whose only generated skills are in `.agents/skills`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-version-status`: Extend generation-version detection to the shared `.agents/skills` root used by Codex and vendor-neutral agent skills.

## Impact

- Affects the server-side skill scanner and its tests.
- Changes the reported generation version and update status for registered projects that only contain OpenSpec skills under `.agents/skills`.
- Does not change API shapes, dependencies, or project files.
