## Why

OpenSpec v1.11 moves Antigravity's generated skills and workflows from `.agent/` to the shared `.agents/` root and can record `antigravity` in `.agents/skills/.openspec-target`, while the WebUI's pinned v1.10 reference and detector still interpret only the former paths and the `agents`/`codex`/`zed` owners. The same release also makes strict validation reject archived placeholder Purposes, exposing three existing main specs that no longer pass the WebUI's default strict validation.

## What Changes

- Refresh the pinned OpenSpec tool-definition reference from v1.10 to v1.11 and record source provenance for the selected release.
- Update the repository maintenance skill to inspect the selected release's official release notes as a required OpenSpec source alongside `docs/supported-tools.md`, and report conflicts instead of silently trusting one source when official release artifacts disagree.
- Detect current Antigravity workflows under `.agents/workflows/` and current shared skills owned by an `antigravity` marker, while retaining read compatibility for legacy `.agent/` artifacts.
- Resolve Antigravity-owned shared skills to `/openspec-*` candidates without synthesizing an unrelated Codex `$openspec-*` candidate.
- Update the tool reference to explain that Antigravity now shares the `.agents` physical root while retaining its own command surface and ownership identity.
- Replace archived placeholder Purpose text in the `cli-runtime`, `live-refresh`, and `task-tracking` main specs with concise authored Purposes so v1.11 strict validation passes.
- Add regression coverage for v1.11 source reconciliation, current and legacy Antigravity layouts, marker handling, candidate generation, and the updated reference data.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tool-reference-maintenance`: Requires the selected release's official release notes to be inspected with the supported-tools documentation and makes source disagreements explicit and reviewable.
- `tool-compatibility-reference`: Updates the pinned source to v1.11 and describes Antigravity's current relationship to the shared `.agents` root.
- `tool-integration-detection`: Recognizes current and legacy Antigravity artifacts and the `antigravity` shared-skill ownership marker.
- `command-shortcuts`: Generates only the valid Antigravity invocation candidates for Antigravity-owned shared skills.

## Impact

- Repository-local maintenance skill and evaluations under `.agents/skills/update-tool-reference/`, plus its updater and regression tests under `scripts/`.
- Pinned tool-reference JSON and its server-side validation/projection tests.
- Server detector types, signatures, marker resolution, API data, and tests.
- Frontend API types, shared-root tool labeling, candidate generation, and tests.
- Main OpenSpec Purpose text for `cli-runtime`, `live-refresh`, and `task-tracking`.
- No dependency change, CLI execution behavior change, or breaking API field removal is introduced.
