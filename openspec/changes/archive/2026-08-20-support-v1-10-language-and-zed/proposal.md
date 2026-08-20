## Why

OpenSpec CLI v1.10 adds first-class artifact-language guidance and Zed Agent support, but the WebUI currently presents its locale selector as a general preference and treats every `.agents/skills` tree as an ambiguous Shared `.agents` / Codex integration. The WebUI should explain the two distinct language settings and recognize the new shared-tree target metadata without redesigning its existing integration model.

## What Changes

- Move the WebUI locale selector out of General into a dedicated Language section.
- Combine the WebUI display-language control with read-only guidance for configuring OpenSpec artifact language, including the official multi-language documentation, existing-project `context` guidance, and a new-project `openspec init --language` example below the guidance.
- Keep WebUI locale selection separate from OpenSpec project configuration; the browser does not edit `openspec/config.yaml` or run the example command.
- Recognize Zed-generated `.agents/skills` trees using the v1.10 `.openspec-target` marker and surface Zed's existing `/openspec-*` invocation form through the current detection and command-shortcut rules.
- Preserve the legacy Shared `.agents` / Codex ambiguity when authoritative target metadata is absent or unusable.
- Localize all new Language and Zed-facing copy across the supported WebUI locales.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `settings-view`: Adds an independent Language section containing both the existing WebUI locale preference and OpenSpec artifact-language guidance.
- `ui-localization`: Localizes the new Language-section guidance, command example labels, documentation link, and Zed integration labels.
- `tool-integration-detection`: Uses `.agents/skills/.openspec-target` to distinguish v1.10 shared-tree targets and recognize Zed evidence.
- `command-shortcuts`: Resolves Zed and other shared-tree invocation candidates from authoritative target metadata while retaining the legacy fallback.

## Impact

- Frontend Settings navigation, Language content, localized message catalogs, shared documentation URLs, and command-copy presentation.
- Server-side repository integration detection and its API types for shared `.agents` target metadata.
- Command candidate labels and tests for Zed, Codex, Shared `.agents`, marker fallback, and localized Language behavior.
- No CLI execution, project-config mutation, or breaking API removal is introduced.
