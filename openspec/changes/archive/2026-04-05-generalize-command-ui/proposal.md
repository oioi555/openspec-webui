## Why

The current UI hardcodes a single Claude-style apply shortcut in the change detail view and offers no settings surface for command syntax or expanded workflows. To keep this repo AI-tool-agnostic, operators need configurable OpenSpec command surfaces that match their tool syntax and only expose expanded commands the local OpenSpec setup can actually support.

## What Changes

- Add a command settings modal launched from the far right side of the primary navigation.
- Add client-side command preferences for AI tool syntax (`default` vs `Claude Code`) and independent expanded-command visibility toggles stored in localStorage.
- Add workflow-availability inspection so expanded command controls only enable commands reported by the local OpenSpec CLI, and disable that UI when availability cannot be loaded.
- Add copyable OpenSpec command buttons to Dashboard, Changes, and ChangeViewer using `/opsx-*` or `/opsx:*` syntax based on the active AI tool setting.
- Remove the old task-number-based floating apply shortcut in favor of generalized workspace and change-scoped command surfaces.

## Capabilities

### New Capabilities
- `command-preferences`: Manage AI tool syntax selection, expanded-command visibility preferences, workflow-aware settings state, and the settings modal entry point.
- `command-shortcuts`: Generate and surface copyable OpenSpec commands on workspace and change views based on the active settings and change state.

### Modified Capabilities
- `task-tracking`: Remove the legacy floating next-task apply shortcut because command-copy behavior moves to generalized command surfaces.

## Impact

- Affected frontend areas: navigation, dashboard, changes list, change viewer, new settings modal/store, and command-generation helpers.
- Affected backend areas: read-only API support for inspecting local OpenSpec workflow availability.
- Affected persistence: browser localStorage for command preferences.
- Affected specs: new `command-preferences` and `command-shortcuts`, plus a delta for `task-tracking`.
