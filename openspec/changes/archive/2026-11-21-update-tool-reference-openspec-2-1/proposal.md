# Proposal

## Why

OpenSpec 2.x makes skills the only delivery and installs them once per machine by default. Its tool list and each tool's skill folders come from the Vercel `skills` package that the release bundles (`skills@1.8.1` for v2.1.1). Each tool is then one of three kinds:
- **universal**: reads `~/.agents/skills` and `.agents/skills` directly;
- **linked**: gets its own global folder, which links to the universal copy (for example Claude Code at `$CLAUDE_CONFIG_DIR/skills`);
- **project-only**: has no global folder (`eve`, `promptscript`). These tools always need a project install.

The WebUI reference data is still the v1.14.0 snapshot:
- it still lists command files and Amazon Q;
- it is missing about 35 new tools;
- it does not record which of the three kinds each tool is.

The global folder table added by the previous change was taken from `skills@1.9.0` instead of the version that OpenSpec actually bundles. The frontend also keeps its own copy of the tool display names.

## What Changes

- **Re-pin to v2.1.1.** The official dataset is re-pinned to v2.1.1. Maintenance reads `docs-lab/reference/supported-tools.md` for 2.x releases and keeps `docs/supported-tools.md` for 1.x.
- **Record each tool's skill scope support.** For each tool, the dataset records whether it is universal, linked (with its global folder), or project-only. The values are taken from the `skills` version pinned in that OpenSpec release's `package.json`. This replaces the hard-coded `GLOBAL_SKILL_DIRS`, and the table carries its source package version.
- **Keep 1.x detection.** The command-file signatures and retired tools (`amazon-q`) move into a frozen, WebUI-owned 1.x legacy table, so detection of 1.x repositories does not depend on the official snapshot.
- **Serve names and scope support.** The tool-reference API serves display names and the scope support. The frontend drops `OPENSPEC_TOOL_NAMES`. Settings uses the scope support (see `update-settings-guidance-openspec-2`).
- **Commands retired note.** The compatibility reference dialog states once that Commands were retired in 2.0, and shows each tool's scope support.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tool-reference-maintenance`: per-release-line source page; scope support data taken from the OpenSpec-bundled `skills` version.
- `tool-integration-detection`: global folders come from the maintained scope data; 1.x command and retired-tool detection uses a frozen legacy table.
- `tool-compatibility-reference`: Commands shown as retired for a 2.x snapshot; scope support shown per tool; names served to the client.

## Impact

- `scripts/update-tool-reference.mjs`, its tests, `.agents/skills/update-tool-reference/SKILL.md`.
- `src/server/data/tool-reference/*.json`: re-pin, plus new scope data and the legacy table.
- `src/server/tool-integration-detection.ts`, `tool-compatibility-reference.ts`, API types.
- `frontend/src/lib/toolChoices.ts`, the compatibility reference dialog, and messages.
