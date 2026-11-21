# Tasks

## 1. Project-scope 2.x layout

- [x] 1.1 Make `listSubdirs()` in `src/server/tool-integration-detection.ts` include symbolic-link entries whose followed `stat()` is a directory. Verify that `.claude/skills/openspec-*` links into `.agents/skills` report Claude Code skill evidence with link-relative sources, and that dangling links are ignored.
- [x] 1.2 Replace `resolveSharedSkillTarget` with multi-line parsing (`<tool>` / `<tool> own-files`, blank lines ignored, unknown ids dropped). Expose `sharedSkillTargets` and derive the legacy `sharedSkillTarget` (single old value kept, several → `multi`, none → `legacy`). Verify that 1.x single-value markers produce unchanged results.
- [x] 1.3 Add a detection fixture that mirrors `openspec init --scope project --tools claude,cursor,codex,kimi` (2.1.1). Verify it detects Claude Code (own folder) and one shared integration with targets `codex, cursor, kimi`.

## 2. Global skill detection

- [x] 2.1 Add the `homeDir` / `claudeConfigDir` dependency seams and the `GLOBAL_SKILL_DIRS` table (source: Vercel `skills@1.9.0`, non-universal agents that map to detected OpenSpec tool ids). Verify with a test that every key is a detected tool id.
- [x] 2.2 Add the global pass: universal `~/.agents/skills` as an ambiguous slash plus dollar integration, and tool-specific global folders. Mark rows `scope: "global"` with `~/`-relative sources. Skip the pass when the project root resolves to the home folder. Verify with temp-home fixtures, including `CLAUDE_CONFIG_DIR`.
- [x] 2.3 Add `scope: "project"` to every repository-local integration and thread the new fields through `openspec-config.ts` and the API route. Verify the server integration test covers project-only, global-only, and mixed results.

## 3. Frontend

- [x] 3.1 Extend `frontend/src/lib/types/api.ts` and the `api.ts` guards with `scope`, `sharedSkillTargets`, and `multi`. Verify that unknown values degrade to `legacy` / `project`.
- [x] 3.2 Update `toolChoices.ts` so a shared integration with `sharedSkillTargets` produces one labelled candidate per listed non-own-files tool using its documented form (Codex `$`, Kimi `/skill:`, others `/`), and global integrations take part in grouping. Verify `toolChoices.test.ts` covers the 2.1.1 fixture, global-only, and project + global dedupe.
- [x] 3.3 Show `Project` / `Global` badges in the Settings Tools list. Show the zero-detection warning only when both scopes are empty, and add the global-only note. Add the en/ja messages. Verify with `npm run typecheck`.

## 4. Integrated verification

- [x] 4.1 Run `npm test` and verify the complete suite passes.
- [x] 4.2 Run `npm run typecheck` and `npm run build` and verify both exit successfully.
- [x] 4.3 Run `openspec validate support-openspec-v2-skill-scopes --strict` and verify that the only warnings are the pre-existing over-500-character requirement texts carried by the two MODIFIED requirements (repo-wide strict cleanup is a separate change).
- [x] 4.4 Start the dev server against a real 2.1.1 global-scope project and a project-scope project. Verify that command shortcuts appear on the Dashboard and that Settings shows the correct scope badges.
