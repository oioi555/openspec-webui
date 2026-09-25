# Tasks

## 1. Tool-reference pin

- [x] 1.1 Run `scripts/update-tool-reference.mjs` analysis for target `v1.13.2` (revision `db2309783547a14e150dbcbfc19120e4028446c3`) with both official sources, recording the `agents` display-name conflict and the `antigravity` `.agent` vs `.agents` path conflict with the design resolutions, and putting the Kilo Code Commands path `.kilo/command/opsx-<id>.md` in the input dataset; reuse the existing Vercel candidates and revision; verify the analysis prints those conflicts, `writeAllowed: true`, empty `added`/`missing`, and a review hash.
- [x] 1.2 Write the reviewed snapshot with `--write --review-hash` and verify `openspec-tools.json` source is `v1.13.2` / `db2309783547a14e150dbcbfc19120e4028446c3`, still has 40 tools, `kilocode` Commands path is `.kilo/command/opsx-<id>.md`, skills stay `.kilocode/skills/openspec-*/SKILL.md`, `agents.name` remains `Shared .agents skills`, `antigravity` paths remain `.agents`, and the research list still has 33 clients at revision `435076e78988e1e6ec40d00b0b1d76bdbbc5419a`.
- [x] 1.3 Update snapshot assertions in `src/server/tool-compatibility-reference.test.ts`, `src/server/tool-reference-data.test.ts`, and `src/server/server.integration.test.ts` from `v1.13.1` to `v1.13.2`, including the Kilo Code Commands path, without renaming detector labels; verify those focused tests pass.

## 2. Kilo Code detection

- [x] 2.1 Append a legacy `.kilocode/workflows` filename command signature after the current Kilo Code snapshot path in `src/server/tool-integration-detection.ts`, keeping `.kilocode/skills` as the skill spec; verify current-path files still produce `/opsx-<id>` Commands evidence.
- [x] 2.2 Add focused detection tests covering current `.kilo/command`, legacy `.kilocode/workflows`, overlapping workflow ids (current path wins, unique legacy ids fill in), skills under `.kilocode/skills`, and both deliveries; verify `npm test -- src/server/tool-integration-detection.test.ts` passes.

## 3. Integrated verification

- [x] 3.1 Run `npm test` and verify the complete test suite passes.
- [x] 3.2 Run `npm run typecheck` and `npm run build` and verify both commands exit successfully.
- [x] 3.3 Run `openspec validate --all --strict --json` and verify all project specs and this change pass with zero failed items.
