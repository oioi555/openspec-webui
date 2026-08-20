## Why

The WebUI maintains a local interpretation of OpenSpec's supported-tool definitions, while many AI clients can also consume one shared `.agents/skills` tree independently of their dedicated OpenSpec setup target. Users cannot currently inspect either the copied official definitions or the separately researched compatibility relationships, making it difficult to understand when one shared setup can serve multiple tools.

## What Changes

- Add an independent tool-definition and Shared Agent Skills reference dialog opened from the Settings Tools section.
- Visualize the complete OpenSpec-supported tool definition set, including tool id, Commands path, Skills path, delivery, and invocation information, with the upstream OpenSpec source version and documentation link.
- Present a non-exhaustive snapshot of researched `.agents/skills` candidates without representing it as part of OpenSpec's official support table or as WebUI-verified compatibility.
- Describe reported shared-path access precisely, distinguishing project-path discovery, global-only discovery, configurable paths, import/symlink workflows, Agent Skills format-only evidence, and conflicting or incomplete research.
- Include only clients for which useful `.agents/skills` research has been found, allow third-party clients not yet supported by OpenSpec, and treat absence from the snapshot as no conclusion.
- Seed the reported project-path relationships for major clients such as OpenCode, Codex, Cursor, Zed, Antigravity, Grok Build, Gemini CLI, GitHub Copilot, Kimi, Qwen, Kilo Code, and Pi, while retaining source and research-date metadata.
- Explain that sharing `.agents/skills` does not make OpenSpec targets interchangeable: `agents` and `zed` render slash-style references, while Codex requires the explicit `codex` target and dollar-style references; a Codex-led tree can also serve slash-style clients, but an `agents`-only tree is not a Codex setup.
- Keep the dialog read-only and separate from repository artifact detection, installed-executable claims, and automatic setup execution.
- Localize all dialog content while preserving tool ids, filesystem paths, commands, and product names.

## Capabilities

### New Capabilities

- `tool-compatibility-reference`: Defines the independent dialog, official OpenSpec definition table, Shared Agent Skills compatibility model, evidence provenance, and responsive presentation.

### Modified Capabilities

- `ui-localization`: Extends catalog parity and fixed-token rules to the new tool compatibility dialog.

## Impact

- Settings Tools gains a read-only entry point for an independent reference dialog; its existing detected-integration list remains unchanged.
- The server/shared tool-definition model becomes available to the frontend as reference data rather than being redefined in UI code.
- A curated, non-exhaustive compatibility dataset records reported access mode, scope, evidence source, research date, and optional version constraints separately from OpenSpec's official definitions.
- Frontend dialog, table/filter presentation, responsive behavior, accessibility, localization catalogs, and tests are added.
- No tool is installed, no repository files are changed, and compatibility does not assert that a corresponding executable is installed.
