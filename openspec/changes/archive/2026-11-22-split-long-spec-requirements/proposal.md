# Proposal

## Why

Since OpenSpec 1.14.1, `openspec validate --strict` warns when a requirement's statement is longer than 500 characters. In this repository, 95 requirements across 34 main specs exceed that limit, so `openspec validate --specs --strict` fails for 34 of 42 specs. Those warnings hide new problems, and they make every change that MODIFIES a long requirement fail strict validation.

## What Changes

For each of the 95 requirements, apply one of these, with no behavior change:
- **Shorten.** Keep the normative statement, and move examples, enumerations and edge cases into scenarios.
- **Split.** When one requirement states several independent behaviors, keep one behavior under the original name and add the others as new requirements with their own scenarios.

Every existing SHALL keeps an equivalent SHALL or scenario. No behavior is added or removed. When this change is archived, `openspec validate --specs --strict` passes for every spec.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

The 34 specs with long requirements; the deltas are text-only:
- `activity-bar`, `change-browsing`, `change-other-files`, `cli-runtime`, `client-project-binding`
- `command-preferences`, `command-shortcuts`, `context-copy`, `explorer-item`, `explorer-pane`
- `live-refresh`, `multi-project-sessions`, `openspec-cli-invocation`, `project-context`, `project-registry`
- `project-selector-ui`, `project-version-status`, `runes-state-management`, `search`, `settings-view`
- `shadcn-integration`, `shared-ui-parts`, `spec-browsing`, `store-discovery`, `store-relationships`
- `tabbed-viewer`, `task-tracking`, `theme-management`, `tool-compatibility-reference`, `tool-integration-detection`
- `tool-reference-maintenance`, `ui-localization`, `validation`, `versions-page`

## Impact

- `openspec/specs/**` only, through MODIFIED and ADDED deltas.
- No code change.
- Run this change last, after the other OpenSpec 2.x changes are archived, so that the deltas are written against the final main specs.
