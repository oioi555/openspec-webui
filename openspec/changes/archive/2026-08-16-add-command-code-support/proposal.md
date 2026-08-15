## Why

OpenSpec CLI v1.9 adds first-class Command Code support, generating commands and skills under `.commandcode/`. The WebUI does not inspect those paths, so Command Code integrations are omitted from Settings and Command Code-only projects report an unknown generated version.

## What Changes

- Detect Command Code command artifacts under `.commandcode/commands` using the `/opsx-<id>` invocation form.
- Detect Command Code skill artifacts under `.commandcode/skills` using the `/openspec-*` invocation form.
- Include `.commandcode/skills` when reading `metadata.generatedBy` for per-project OpenSpec generation-version status.
- Add regression coverage for Command Code integration and version detection without changing existing tool behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tool-integration-detection`: Recognize repository-local Command Code command and skill artifacts and expose their existing workflow-specific evidence.
- `project-version-status`: Detect the generated OpenSpec version when Command Code skills are the project's only readable version markers.

## Impact

- Affects `src/server/tool-integration-detection.ts`, `src/server/skill-scanner.ts`, and their tests.
- Settings can list Command Code as a configured repository integration and use its evidence for existing command-shortcut candidate resolution.
- The Versions view can report generation status for Command Code-only projects.
- No API shape, dependency, CLI invocation, or persisted-data changes are required.
