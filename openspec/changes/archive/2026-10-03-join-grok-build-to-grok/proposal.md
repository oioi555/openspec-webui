# Proposal

## Why

Official OpenSpec v1.14.0 lists Grok Build as tool id `grok`, but the Shared `.agents` research snapshot still uses Vercel client id `grok-build`. The maintenance JOIN matches only exact ids, so Settings shows Grok Build as outside the OpenSpec table even though the official catalog already includes it.

## What Changes

- Join Vercel client `grok-build` to official tool id `grok` when the pinned official snapshot contains `grok`.
- Keep that linkage in the updater through a reviewed client-id alias so a later catalog pin does not drop it.
- Leave other unlinked research clients unchanged. Do not add aliases for them in this change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tool-reference-maintenance`: Join shared research clients to official tools on exact id, then on a reviewed alias map that includes `grok-build` → `grok`.

## Impact

- `scripts/update-tool-reference.mjs` JOIN resolution and its maintenance tests.
- `src/server/data/tool-reference/shared-agents-research.json` `grok-build` record.
- Snapshot assertions in `src/server/tool-compatibility-reference.test.ts` (and the tool-reference API test if it asserts linkage).
- `.agents/skills/update-tool-reference/SKILL.md` JOIN wording.
- Settings dialog UI stays data-driven: the 共有 `.agents` 調査 row for Grok Build shows official id `grok`.
- Detection allowlist, command chips, the Vercel client list, other unlinked clients, and package version stay as they are.
