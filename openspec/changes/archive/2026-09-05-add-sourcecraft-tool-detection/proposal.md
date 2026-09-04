## Why

OpenSpec v1.12.0 can generate SourceCraft Code Assistant commands and skills, and the pinned tool reference already describes those artifacts, but the WebUI detector does not allowlist `codeassistant`. As a result, repositories configured for SourceCraft are omitted from Settings and cannot contribute evidence-backed command shortcuts.

## What Changes

- Detect SourceCraft command artifacts under `.codeassistant/commands` and report their `/opsx-<id>` invocation form.
- Detect SourceCraft skill artifacts under `.codeassistant/skills` and represent their documented natural-language `use the openspec-<skill> skill` invocation form.
- Expose SourceCraft evidence through command availability, Settings, supported tool options, and installed-only grouped copy choices without synthesizing evidence for unconfigured repositories.
- Add server, API, and frontend regression coverage for command-only, skill-only, dual-delivery, and absent-artifact cases.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tool-integration-detection`: Recognize repository-local SourceCraft Commands and Skills artifacts and expose their workflow-specific evidence.
- `command-shortcuts`: Generate and group SourceCraft's documented natural-language skill invocation when a matching SourceCraft skill is the available evidence.

## Impact

- Server detection and shared invocation-form contracts in `src/server/tool-integration-detection.ts`.
- Command availability API serialization and validation of the added invocation form.
- Frontend invocation-form types, command generation, and grouped tool-choice behavior.
- Existing detector, API, command shortcut, and tool-choice tests.
- No dependency changes and no additional tool-reference data refresh; the user-updated v1.12.0 `codeassistant` definition remains the source of paths and invocation strings.
