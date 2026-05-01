## Why

New users can land on an empty state without understanding that OpenSpec projects must be installed and initialized with `openspec init` before they can be selected. Because the project selector only lists already-initialized projects, the current flow can feel like a dead end unless the app explains the setup step and points to the right docs.

## What Changes

- Expand the empty project state into the primary onboarding surface with a clear explanation of the `openspec init` prerequisite
- Add links from the empty state to OpenSpec installation and CLI setup documentation so first-time users can self-serve
- Keep AddProjectDialog concise, but add a short initialization hint and clearer missing-`openspec/` guidance
- Localize the new onboarding guidance and validation copy across all supported locales
- Reuse shared OpenSpec documentation URL constants across onboarding and settings surfaces
- Keep ProjectSelector focused on already-registered, initialized projects

## Capabilities

### New Capabilities

- `none`

### Modified Capabilities

- `project-selector-ui`: empty-state onboarding guidance, setup links, and add-project prerequisite messaging
- `command-preferences`: settings documentation links should reuse the same shared OpenSpec docs URL constants as onboarding surfaces
- `ui-localization`: new onboarding guidance text, hints, and error copy must be translated in every supported locale

## Impact

- `frontend/src/lib/components/layout/EmptyProjectState.svelte`
- `frontend/src/lib/components/layout/AddProjectDialog.svelte`
- `frontend/messages/*.json`
- `frontend/src/lib/openspecDocs.ts`
- `frontend/src/lib/components/layout/SettingsModal.svelte`
- `openspec/specs/project-selector-ui/spec.md`
- `openspec/specs/command-preferences/spec.md`
- `openspec/specs/ui-localization/spec.md`
- User-facing links to OpenSpec installation and CLI setup docs
