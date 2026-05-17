## Why

Socket.dev flags `openspec-webui@0.3.2` for both dependency advisories and expected local-tool permissions such as network, shell, environment, and filesystem access. We should remediate actionable dependency issues while documenting the intentional permissions needed by the local-first CLI/WebUI instead of removing useful functionality only to satisfy heuristic alerts.

## What Changes

- Add a concise README security/permissions section that explains local binding, project file access, explicit validation command execution, and npm registry version checks.
- Clarify that project contents are not sent to external services, install-time scripts are not used, and package permissions are tied to user-facing local workflows.
- Update vulnerable/outdated dependency resolutions, including `@fastify/static` and npm-audit-fixable transitive packages.
- Run the existing verification flow so dependency updates do not regress packaging, CLI runtime, or frontend behavior.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `package-distribution`: Document the published package's intentional runtime permissions and keep distributed dependency metadata free of known npm audit findings where fixes are available.

## Impact

- Affected files: `README.md`, `package.json`, `package-lock.json`, and generated attribution if dependency changes alter third-party notices.
- Affected systems: npm package distribution, release verification, local CLI/server runtime.
- No breaking changes or feature removals are intended.
