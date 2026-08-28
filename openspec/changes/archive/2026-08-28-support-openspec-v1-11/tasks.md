## 1. Official Source Maintenance

- [x] 1.1 Update `.agents/skills/update-tool-reference/SKILL.md` so every release-targeted refresh retrieves and reports both the tagged `docs/supported-tools.md` and the matching official GitHub release notes before external candidate research; verify `npm test -- scripts/tool-reference-skill.test.mjs` passes with release-note requirements covered.
- [x] 1.2 Extend `scripts/update-tool-reference.mjs` analysis input and conflict reporting to represent both official sources, fail closed when either is unavailable, and require reviewed resolution for disagreements; verify focused updater tests cover agreement, the v1.11 Antigravity path conflict, and unavailable release notes.
- [x] 1.3 Refresh `src/server/data/tool-reference/openspec-tools.json` to the reviewed v1.11 definition set, recording the selected immutable revision and current Antigravity `.agents` paths; verify tool-reference data validation and no-change hash behavior pass.

## 2. Antigravity Detection and API Contract

- [x] 2.1 Extend the shared target types and marker resolver with `antigravity` across server and frontend API types; verify focused type/detection tests accept the new value while preserving invalid-marker legacy fallback.
- [x] 2.2 Update runtime signatures and reconciliation so current `.agents/workflows`, shared `.agents/skills` owned by Antigravity, and legacy `.agent` artifacts become one logical integration with current-path precedence; verify detector tests cover current-only, legacy-only, coexistence, marker-without-skills, and non-Antigravity shared roots.
- [x] 2.3 Update compatibility-reference projection and tests to present current and legacy Antigravity paths and shared-root ownership accurately; verify the tool compatibility reference tests pass with the v1.11 snapshot.

## 3. Command Candidate Resolution

- [x] 3.1 Map an `antigravity` shared target to the `Antigravity` label and slash skill form without a synthetic Codex dollar form; verify frontend tool-choice tests cover skill-only Antigravity evidence.
- [x] 3.2 Preserve per-workflow Commands-first behavior after current command and shared skill inventories are merged; verify tests show `/opsx-<id>` wins when both deliveries match and `/openspec-<skill>` remains available when that workflow's command artifact is absent.
- [x] 3.3 Add API/integration coverage confirming Antigravity target metadata and inventories reach the frontend without removing existing fields; verify the focused server integration tests pass.

## 4. v1.11 Strict Validation Compatibility

- [x] 4.1 Replace the placeholder Purpose in `openspec/specs/cli-runtime/spec.md` with an authored description of the existing CLI runtime capability; verify strict validation no longer reports its Purpose warning.
- [x] 4.2 Replace the placeholder Purpose in `openspec/specs/live-refresh/spec.md` with an authored description of the existing file-watching and client-refresh capability; verify strict validation no longer reports its Purpose warning.
- [x] 4.3 Replace the placeholder Purpose in `openspec/specs/task-tracking/spec.md` with an authored description of the existing task parsing and progress capability; verify strict validation no longer reports its Purpose warning.

## 5. Integrated Verification

- [x] 5.1 Run `npm run test` and verify the complete test suite passes.
- [x] 5.2 Run `npm run typecheck` and `npm run build` and verify both commands exit successfully.
- [x] 5.3 Run `openspec validate --all --strict --json` with OpenSpec v1.11 and verify all project specs and this change pass with zero failed items.
