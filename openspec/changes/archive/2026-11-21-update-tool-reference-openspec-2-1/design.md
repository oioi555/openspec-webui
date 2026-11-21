# Design

## Context

- `buildToolSpec()` derives every detector signature, including the 1.x `/opsx` command paths, from `openspec-tools.json`. It throws when a detected id is missing.
- OpenSpec 2.1.1 builds `AI_TOOLS` from its own tools plus every agent in its bundled `skills@1.8.1` `getSupportedAgents()`.
- `installerAgent(toolId)` maps an OpenSpec id to a skills agent through `installerAliases`, falling back to `universal`. `supportsGlobalSkills` is `globalSkillsDir !== null`. Only `eve` and `promptscript` lack one.
- The WebUI's `GLOBAL_SKILL_DIRS` came from `skills@1.9.0`.

## Goals / Non-Goals

**Goals:**
- Pin v2.1.1 without changing what 1.x repositories show.
- Every upstream-derived table is produced by the maintenance workflow, from the same `skills` version that OpenSpec ships.
- Settings can tell universal, linked, and project-only tools apart.

**Non-Goals:**
- Making new tools detection-eligible. The allowlist stays explicit; new tools are covered by the shared `.agents` and global rows anyway.
- Settings copy (`update-settings-guidance-openspec-2`).

## Decisions

- **Legacy table first, then re-pin.** Add `openspec-legacy-v1.json` (v1.14.0 `commands` entries, v1.14.0 per-tool skill folders and invocations, plus the retired tool records). `buildToolSpec()` reads commands from the legacy table and uses the union of official and legacy skill folders (each with its own invocation); display names come from the official snapshot. The shared `.agents/skills` tree stays with the shared-agents row. A regression test asserts identical detector output for every 1.x fixture before and after the re-pin.
- **Scope data from the bundled version.**
  - The script reads `package.json` at the selected tag to find the `skills` dependency version. It then reads that version's agent table (`src/agents.ts` at the matching `vercel-labs/skills` tag) and applies OpenSpec's `installerAliases` from `dist/core/config.js` / `src/core/config.ts` at the tag.
  - Output: `tool-scope-support.json` = `{ source: { openspecTag, skillsVersion }, tools: { <id>: { kind: 'universal' | 'linked' | 'project-only', globalDir?, env? } } }`.
  - Alternative: read the Vercel `main` branch. Rejected, because it drifts from what users' CLIs actually do (the 1.9.0 vs 1.8.1 mismatch shows this).
- **Detection uses the data.** The global pass scans `globalDir` for `linked` tools in the detection allowlist. `env` (Claude's `CLAUDE_CONFIG_DIR`) is honoured. The existing "every key is a detected id" test becomes a data-validation test.
- **Served to the client.** The tool-reference response gains `toolNames` and `scopeSupport` maps. `toolChoices` and Settings take them as input.
- **Source page by tag.** The page is chosen by semver major. If the docs-lab table layout differs, a second table reader is added under test with a captured copy, and unknown layouts fail closed.

## Risks / Trade-offs

- [Bundled `skills` version cannot be fetched] → Fail closed like any unavailable source (existing requirement).
- [Retired tools disappear from the reference dialog] → Intended. They remain detection-only through the legacy table.
