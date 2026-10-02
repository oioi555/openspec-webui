# Tasks

## 1. Updater alias and packaged snapshot

- [x] 1.1 Add a reviewed client-id alias map in `scripts/update-tool-reference.mjs` that maps `grok-build` → `grok`, resolve `openSpecToolId` as exact official id then alias target when that target is official, and verify `scripts/tool-reference-maintenance.test.mjs` covers: current Vercel candidates keep `grok-build` linked to `grok`; an alias whose official target is missing stays unlinked; exact id wins if official later includes `grok-build`; unaliased mismatched ids stay unlinked.
- [x] 1.2 Write `openSpecToolId: "grok"` on the `grok-build` record in `src/server/data/tool-reference/shared-agents-research.json`, mention the reviewed alias in `.agents/skills/update-tool-reference/SKILL.md`, and verify `src/server/tool-compatibility-reference.test.ts` asserts `grok-build` → `grok` with the remaining unlinked list excluding `grok-build`.

## 2. Integrated verification

- [x] 2.1 Run `npm test` and verify the complete test suite passes.
- [x] 2.2 Run `npm run typecheck` and `npm run build` and verify both commands exit successfully.
- [x] 2.3 Run `openspec validate --all --strict --json` and verify all project specs and this change pass with zero failed items.
