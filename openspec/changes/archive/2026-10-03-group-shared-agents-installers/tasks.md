# Tasks

## 1. Group official shared-path installers

- [x] 1.1 Add `groupSharedAgentsSkillInstallers` in `frontend/src/lib/toolCompatibilityReference.ts` that selects official tools whose `skills.path` includes `.agents/skills`, groups `$` invocations as dollar and the rest as slash, orders `agents` first then remaining ids alphabetically, and returns compact path `.agents/skills` with `/openspec-*` or `$openspec-*`. Verify `frontend/src/lib/toolCompatibilityReference.test.ts` covers: current pin-shaped ids (`agents`, `amp`, `antigravity`, `gsd`, `zed` slash; `codex` dollar); non-shared paths omitted; singular `.agent/skills` omitted; Zed `/ or @` stays slash; Antigravity commands/workflows do not create a group.

## 2. Compact summary presentation

- [x] 2.1 Derive the compact shared-target summary in `frontend/src/lib/components/layout/ToolCompatibilityDialog.svelte` from unfiltered `reference.officialDefinitions` via `groupSharedAgentsSkillInstallers`, render slash badges as `secondary` and Codex as `outline`, omit workflows and legacy `.agent`, and show caption `tool_reference_shared_installers_intro`. Verify `frontend/src/lib/components/layout/ToolCompatibilityDialog.test.ts` asserts the helper call, the intro key, `/openspec-*` and `$openspec-*`, and `doesNotMatch` `.agents/workflows/opsx-*.md` and `legacy: .agent`.
- [x] 2.2 Add `tool_reference_shared_installers_intro` in all seven `frontend/messages/*.json` locales (Japanese: official targets install into shared `.agents/skills`, the list below’s `.agents` clients can use them, Codex is the `/` exception) and include the key in `frontend/src/lib/locale.test.ts` `TOOL_REFERENCE_KEYS`. Verify `node ./scripts/compile-i18n.mjs` succeeds and the locale test covers the new key.

## 3. Supersede the rejected summary change

- [x] 3.1 Delete the uncommitted `openspec/changes/drop-antigravity-from-shared-agents-summary` folder and verify `openspec list --json` no longer includes that change name.

## 4. Integrated verification

- [x] 4.1 Run `npm test` and verify the complete test suite passes.
- [x] 4.2 Run `npm run typecheck` and `npm run build` and verify both commands exit successfully.
- [x] 4.3 Run `openspec validate --all --strict --json` and verify all project specs and this change pass with zero failed items.
- [x] 4.4 Verify Settings 「共有 .agents 調査」 on the running `:3002` server: slash group includes `agents`, `amp`, `antigravity`, `gsd`, and `zed`; Codex is the `$openspec-*` row; caption is present; workflows and legacy `.agent` are absent from the compact table.
