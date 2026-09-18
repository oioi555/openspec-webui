# Tasks

## 1. Task parser

- [x] 1.1 Replace the hyphen-only checkbox regex in `src/parser/tasks.ts` with the v1.13.1 task-line pattern (indent capture, CommonMark list markers, one-token checkbox, `x`/`X` done, empty descriptions, link-bullet rejection) and verify existing hyphen nested fixtures still report the same `done`/`total`.
- [x] 1.2 Add focused parser tests covering `+`/`*`/`1.`/`1)` markers, `[~]` and empty `[]` as incomplete, padded `[ x]` as complete, empty descriptions, CRLF lines, and rejection of `- [A](https://example.com)` while counting `- [ ](https://example.com)`; verify `npm test -- src/parser/tasks.test.ts` passes.

## 2. Tool-reference pin

- [x] 2.1 Run `scripts/update-tool-reference.mjs` analysis for target `v1.13.1` (revision `634c557bd0470eec37861b46172c3f503d283c1b`) with both official sources, recording the `agents` display-name conflict and the `antigravity` `.agent` vs `.agents` path conflict with the design resolutions; verify the analysis prints those conflicts, `writeAllowed: true`, and a review hash.
- [x] 2.2 Write the reviewed snapshot with `--write --review-hash` and verify `openspec-tools.json` source is `v1.13.1` / `634c557bd0470eec37861b46172c3f503d283c1b`, still has 40 tools, `agents.name` remains `Shared .agents skills`, and `antigravity` paths remain `.agents`.
- [x] 2.3 Update snapshot assertions in `src/server/tool-compatibility-reference.test.ts`, `src/server/tool-reference-data.test.ts`, and `src/server/server.integration.test.ts` from `v1.12.0` to `v1.13.1` without renaming detector labels; verify those focused tests pass.

## 3. Integrated verification

- [x] 3.1 Run `npm test` and verify the complete test suite passes.
- [x] 3.2 Run `npm run typecheck` and `npm run build` and verify both commands exit successfully.
- [x] 3.3 Run `openspec validate --all --strict --json` and verify all project specs and this change pass with zero failed items.
