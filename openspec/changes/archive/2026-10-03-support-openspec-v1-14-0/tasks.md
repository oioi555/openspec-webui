# Tasks

## 1. Tool-reference pin

- [x] 1.1 Run `scripts/update-tool-reference.mjs` analysis for target `v1.14.0` (revision `94ca9c1eb15d1b49c06c988419b75c3d95f8b2b5`) with both official sources, recording the ten missing tagged-table rows, IBM Bob display-name, and agents/antigravity path conflicts with the design resolutions, joining Amp and Warp on the existing Vercel research list, and verify the analysis prints those conflicts, `writeAllowed: true`, and a review hash.
- [x] 1.2 Write the reviewed snapshot with `--write --review-hash` and verify `openspec-tools.json` source is `v1.14.0` / `94ca9c1eb15d1b49c06c988419b75c3d95f8b2b5` / `checkedAt` `2026-10-02`, has 50 tools including Amp, AtomCode, Code Studio, DeepSeek Harness, EasyCode, GigaCode, Grok Build, GSD, Veai, and Warp, `bob.name` is `IBM Bob`, and the research list still has 33 clients at revision `435076e78988e1e6ec40d00b0b1d76bdbbc5419a` with Amp and Warp JOINED.
- [x] 1.3 Update snapshot assertions in `src/server/tool-compatibility-reference.test.ts`, `src/server/tool-reference-data.test.ts`, and `src/server/server.integration.test.ts` to `v1.14.0` / 50 tools / revision `94ca9c1eb15d1b49c06c988419b75c3d95f8b2b5` / `checkedAt` `2026-10-02`, IBM Bob catalog name, and Amp/Warp JOIN (unlinked list no longer includes `amp` or `warp`); verify those focused tests pass.

## 2. Amp and GSD shared-marker ownership

- [x] 2.1 Extend `SharedSkillTarget` with `amp | gsd` on the server and frontend contract (`src/server/tool-integration-detection.ts`, `frontend/src/lib/types/api.ts`, `frontend/src/lib/api.ts` `isSharedSkillTarget`) so `resolveSharedSkillTarget` accepts those marker values; verify TypeScript still typechecks those unions.
- [x] 2.2 After scanning, rename the shared `.agents` integration to `Amp` or `GSD` when the marker owns the tree, keep Amp/GSD off `DETECTED_TOOL_IDS`, and leave `getSupportedToolOptions` without Amp/GSD catalog entries; verify markerless `.agents/skills` still reports Shared `.agents` / Codex and does not claim Amp or GSD.
- [x] 2.3 Update frontend `toolLabelFor` / `skillFormsFor` so Amp and GSD markers use slash-only skill forms and the Amp/GSD labels; verify `frontend/src/lib/toolChoices.test.ts` covers Amp, GSD, and existing zed/agents/antigravity/codex/legacy cases.

## 3. Unique-path detection, `.prompt.md`, and IBM Bob

- [x] 3.1 Append `atomcode`, `codestudio`, `dsh`, `easycode`, `gigacode`, `grok`, `veai`, and `warp` to `DETECTED_TOOL_IDS` in historical order and strip trailing `.prompt.md` as a single command-file suffix before the last-extension fallback; verify Code Studio / GitHub Copilot / Kiro `opsx-<id>.prompt.md` files yield workflow id `<id>` while existing `opsx-<id>.md` files still match.
- [x] 3.2 Drop the `bob` entry from `DETECTION_DISPLAY_NAMES` so detector labels use the catalog name `IBM Bob`, keeping `devin: 'Devin'`; verify Bob command files report tool name `IBM Bob`.
- [x] 3.3 Add focused detection tests for AtomCode, Code Studio `.prompt.md`, EasyCode TOML, GigaCode, DeepSeek Harness, Grok Build, Veai, Warp skills, empty unique-path dirs, bare `WARP.md`, Amp/GSD markers, markerless shared skills, and IBM Bob naming; verify `npm test -- src/server/tool-integration-detection.test.ts` passes.

## 4. Integrated verification

- [x] 4.1 Run `npm test` and verify the complete test suite passes.
- [x] 4.2 Run `npm run typecheck` and `npm run build` and verify both commands exit successfully.
- [x] 4.3 Run `openspec validate --all --strict --json` and verify all project specs and this change pass with zero failed items.
