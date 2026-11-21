---
name: update-tool-reference
description: Update pinned OpenSpec tool definitions, per-tool skill scope support, and the .agents/skills mapping from official release data and vercel-labs/skills. Use for OpenSpec releases and reference refreshes. Never detect releases or schedule itself.
compatibility: Requires network for official sources, Node.js 20+, and this repository's scripts/update-tool-reference.mjs.
---

# Update Tool Reference

Reconcile OpenSpec's tagged documentation with its official GitHub release notes, then join the reviewed definitions with `vercel-labs/skills` candidates. Join on exact client id first, then on the reviewed alias map in `scripts/update-tool-reference.mjs` (`grok-build` → `grok`). Do not invent aliases during a pin.

## Preconditions

1. Require the caller to provide the target OpenSpec release/tag. If absent, stop and ask for it.
2. Do not poll GitHub, detect releases, schedule a future run, or start automation. The caller owns invocation timing.
3. Default to analysis only. Never write data until the proposed diff and review hash have been shown and the caller explicitly approves the write.

## Source order

1. Fetch `docs/supported-tools.md` from the exact caller-selected OpenSpec release/tag for releases before `v2.0.0`, or `docs-lab/reference/supported-tools.md` for `v2.0.0` and later. The page is chosen by semver major (`supportedToolsPage()` in `scripts/tool-reference-sources.mjs`); the official dataset's source URL must name the page actually read. Each release line has its own table reader; an unknown table layout fails closed.
2. Fetch the matching official GitHub release notes from `https://github.com/Fission-AI/OpenSpec/releases/tag/<tag>`. Release notes are formal OpenSpec release data, not an exception or an external candidate source.
3. Reconcile those two official sources before constructing the proposed definition snapshot. Report exact tool/field conflicts; use shipped tagged config or adapter files only as corroboration for a reviewable resolution.
4. For `v2.0.0` and later, build the skill scope support from what the release bundles: read the exact `skills` version from the tag's `package.json`, read `src/agents.ts` at that `vercel-labs/skills` tag, and apply OpenSpec's `installerAliases` and `existingTools` from `src/core/config.ts` at the tag. Mirror upstream: `installerAgent(toolId)` maps through `installerAliases`, then the same id, then `universal`; a tool with no `globalSkillsDir` is `project-only`; a universal agent that reads `~/.agents/skills` globally is `universal`; every other tool is `linked` with its `globalDir` (and `env` override). Never use the `skills` `main` branch. The 2.x tool list is the tag's `AI_TOOLS` (existing tools plus bundled agents), because the page defers the full list to `openspec init --help`; ids not on the page are reported as `notListedOnPage`. If any of these sources is unavailable, scope support is unavailable and the write is refused.
5. Read the `vercel-labs/skills` Supported Agents source (e.g. `src/agents.ts` with `skillsDir === '.agents/skills'`) only to discover candidates. See https://github.com/vercel-labs/skills
6. Union with previous records so missing clients can be reported instead of silently deleted.

Vercel membership proves only that a client is a candidate for `.agents/skills`. No exhaustive per-client vendor-doc sweep is required for this reference. Keep a short note only for exceptions (e.g. Hermes global requires config).

## Build the analysis input

For `v2.0.0` and later, assemble the input from GitHub (fails closed per source; release-note conflicts stay empty for you to fill in after reading `releaseNotes.body`):

```bash
node --import tsx scripts/update-tool-reference.mjs --prepare vX.Y.Z --checked-at YYYY-MM-DD --out <temporary-input.json>
```

Otherwise create a temporary JSON input outside the repository with:

```json
{
  "targetRelease": "vX.Y.Z",
  "checkedAt": "YYYY-MM-DD",
  "openspec": {
    "available": true,
    "url": "https://github.com/Fission-AI/OpenSpec/blob/vX.Y.Z/docs/supported-tools.md",
    "revision": "immutable-tag-or-commit",
    "dataset": {}
  },
  "releaseNotes": {
    "available": true,
    "url": "https://github.com/Fission-AI/OpenSpec/releases/tag/vX.Y.Z",
    "revision": "immutable-tag-or-commit",
    "conflicts": []
  },
  "vercelSkills": {
    "available": true,
    "url": "https://github.com/vercel-labs/skills",
    "revision": "commit-sha",
    "candidates": [{ "id": "client-id", "name": "Client Name" }]
  },
  "skillScope": {
    "available": true,
    "openspecTag": "vX.Y.Z",
    "skillsVersion": "1.8.1",
    "agents": [{ "id": "claude-code", "name": "Claude Code", "projectSkillsDir": ".claude/skills", "globalSkillsDir": { "path": ".claude/skills", "env": { "name": "CLAUDE_CONFIG_DIR", "path": "skills" } }, "universal": false, "globalReadsCanonical": true }],
    "installerAliases": { "claude": "claude-code" }
  }
}
```

`skillScope` is required for `v2.0.0` and later and ignored for earlier releases. The written `tool-scope-support.json` is `{ source: { openspecTag, skillsVersion }, tools: { <id>: { kind: 'universal' | 'linked' | 'project-only', globalDir?, env? } } }` with one entry per official tool id.

## Analyze

Run:

```bash
node --import tsx scripts/update-tool-reference.mjs --input <temporary-input.json> --json
```

Present the target release, the supported-tools page read, both official source revisions, added/removed official tool ids and any remaining Commands, the bundled `skills` version and the scope support diff (added, removed, changed per tool id), any official-source conflicts and proposed resolutions, unavailable sources, added/missing clients, and review hash. A no-change run stops here without rewriting files.

If either official source is unavailable, stop without writing. If the sources disagree, include a structured conflict with the affected tool, fields, both claims, and a non-empty resolution source and summary. The reviewed hash is the caller's explicit approval of that resolution; an unresolved conflict is never writable.

## Write only after approval

After the caller explicitly approves the displayed diff, rerun:

```bash
node --import tsx scripts/update-tool-reference.mjs \
  --input <temporary-input.json> \
  --write \
  --review-hash <displayed-sha256>
```

The command validates the datasets and writes them, including `tool-scope-support.json` for 2.x releases (`--scope-path` overrides its location). If the hash or datasets changed, return to analysis.

## Verify

Run all of:

```bash
npm test
npm run typecheck
npm run build
openspec validate externalize-tool-reference-data --strict
```

Confirm `dist/server/data/tool-reference/` contains the JSON files.

## Report

Report what changed, which official release documents were checked, source conflicts or failures, and whether a write occurred. Never describe absence from the list as proven non-support. Primary provenance for the shared list is `vercel-labs/skills`.
