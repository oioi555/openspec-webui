# Proposal

## Why

OpenSpec 2.0 dropped command files and installs every workflow as a skill in `.agents/skills/`, giving other tools links instead of copies. OpenSpec 2.1 made machine-wide (global) skills the default for new repositories. The WebUI detector was built for the 1.x layout and fails against real 2.1.1 projects:

- Project scope (`openspec init --scope project`): `.claude/skills/openspec-*` are symlinks into `.agents/skills/`. `listSubdirs()` keeps only `Dirent.isDirectory()`, so Claude Code and other link-based tools are not detected.
- `.agents/skills/.openspec-target` is now one line per tool (`claude own-files`, `codex`, `cursor`, `kimi`). The detector expects a single value, so every 2.x marker is read as `legacy` and tool-specific forms such as Kimi's `/skill:openspec-*` are lost.
- Global scope (the 2.1 default): the repository holds no skills at all. The installed-only candidate rule then hides every command shortcut, and Settings reports that no integrations were found.

## What Changes

- Follow symlinks and junctions when enumerating `openspec-*` skill directories. Broken links are not evidence.
- Parse the multi-line `.openspec-target` marker into a list of tool ids. Keep the existing single-value meanings.
- Detect global OpenSpec skills from the universal folder `~/.agents/skills` and from the global skills folders of tools that do not read the universal folder (for example Claude Code at `$CLAUDE_CONFIG_DIR/skills` or `~/.claude/skills`). Report them as integrations with `scope: "global"`, alongside repository-local ones with `scope: "project"`.
- Build command-shortcut candidates from project and global evidence. Settings shows a scope badge for each integration and warns only when neither scope has evidence.
- Expose the new metadata additively in the API: `scope`, `sharedSkillTargets`. Keep `sharedSkillTarget` for compatibility.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tool-integration-detection`: link-aware skill enumeration, multi-line marker parsing, global skill detection, a scope field, and a zero-detection warning that covers both scopes.
- `command-shortcuts`: candidates from global evidence and from multi-tool shared markers.

## Impact

- `src/server/tool-integration-detection.ts` (enumeration, marker parsing, global scan, home-folder guard).
- `src/server/openspec-config.ts` and `routes/api.ts` (pass the home and Claude config directories through injectable dependencies).
- Frontend `types/api.ts`, `api.ts` guards, `toolChoices.ts`, and the `SettingsView.svelte` integration list and messages (en/ja).
- Tests: detection, toolChoices, and server integration.
- Out of scope, handled by a follow-up change: re-pinning the tool reference to OpenSpec 2.1.1 (new and retired tools, `docs-lab` source), retiring the `delivery` display and docs links, and Windows standalone `openspec.exe` invocation.
