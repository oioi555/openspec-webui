# Proposal

## Why

OpenSpec v1.13.2 moved Kilo Code command files from `.kilocode/workflows/` to `.kilo/command/`, the directory Kilo Code actually reads. The WebUI's official tool snapshot is still sourced from v1.13.1, so Settings Tools and repository detection still look at the old command path. After `openspec update`, those files live in the new directory; until then, existing repositories still hold the old ones.

## What Changes

- Pin the official tool-definition snapshot to OpenSpec v1.13.2 through the existing analyze-first maintenance workflow. The tagged table still has 40 tools.
- Update the Kilo Code Commands path to `.kilo/command/opsx-<id>.md`. Skills stay at `.kilocode/skills/openspec-*/SKILL.md`. Invocation stays `/opsx-<id>`.
- Keep scanning legacy `.kilocode/workflows/` so a repository that has not yet run `openspec update` still reports Kilo Code Commands evidence. Prefer the current path when both exist.
- Report the same official-source disagreements as v1.13.1: `agents` display name (tagged table "Shared `.agents` skills" vs picker "Other / Universal") and `antigravity` paths (tagged table `.agent` vs shipped `.agents`). Keep the tagged table name and the current `.agents` snapshot paths. Do not rename detector labels (`Shared .agents / Codex`).
- Keep the existing Shared `.agents/skills` research list; do not prune or expand it as part of this pin.
- No CLI execution, validation, archive internals, task-parser, engines.node, or new tool detection allowlist.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tool-integration-detection`: Recognize current Kilo Code command files under `.kilo/command/` and retain read compatibility for legacy `.kilocode/workflows/`.

## Impact

- `src/server/data/tool-reference/openspec-tools.json` source provenance and the `kilocode` Commands path.
- `src/server/tool-integration-detection.ts` Kilo Code command signatures (current plus legacy), matching the Antigravity dual-path pattern.
- Snapshot assertions in `src/server/tool-compatibility-reference.test.ts`, `src/server/tool-reference-data.test.ts`, and `src/server/server.integration.test.ts`.
- Focused detection tests for current, legacy, and overlapping Kilo Code command files.
- Apply/archive gating, task parser, and validation JSON handling stay as they are.
