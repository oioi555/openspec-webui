## 1. External Data Contracts

- [x] 1.1 Define minimal schema-versioned models and validators for the official snapshot and the shared `.agents/skills` mapping (`{ id, name, openSpecToolId?, note? }`); verify malformed fixtures reject duplicate ids, missing source revisions, and invalid dates.
- [x] 1.2 Move the exact current official definition snapshot into `src/server/data/tool-reference/openspec-tools.json` with pinned source metadata; verify a semantic-equivalence test covers every current id, path, delivery, and invocation.
- [x] 1.3 Move the current shared mapping into `shared-agents-research.json` as a flat list with single source (`vercel-labs/skills`) and `updatedAt`; verify projection tests produce the same displayed 32 clients as before.

## 2. Runtime Integration And Isolation

- [x] 2.1 Refactor the server reference module to import, validate, and project both JSON datasets while preserving `GET /api/tool-reference` shape (now with `sharedSource`); verify API fixtures remain unchanged.
- [x] 2.2 Continue deriving detector paths from validated official rows while retaining the code-owned `DETECTED_TOOL_IDS` allowlist; verify every allowlisted id resolves.
- [x] 2.3 Verify the production compiler emits both JSON files under `dist/server/data/tool-reference/` and that the API loads offline.

## 3. Candidate Maintenance

- [x] 3.1 Implement deterministic 2-source union for pinned OpenSpec supported-tools and `vercel-labs/skills` Supported Agents; verify fixtures produce a stable union.
- [x] 3.2 Implement simple added/missing detection with optional per-client `note` for exceptions (Hermes, ForgeCode, Loaf, Copilot); verify disappeared records are reported.
- [x] 3.3 Keep `openSpecToolId` classification relative to the caller-selected OpenSpec release; verify official/external join is correct.

## 4. Dry-Run And Updates

- [x] 4.1 Add a simple diff/report covering source revisions and added/missing clients; verify deterministic output.
- [x] 4.2 Make analysis/dry-run the default and require an explicit write with review hash; verify default leaves tracked data unchanged.
- [x] 4.3 Validate both datasets before writing and fail closed on unavailable sources.

## 5. Repository Update Skill

- [x] 5.1 Use the `skill-creator` workflow to add `.agents/skills/update-tool-reference/SKILL.md`, encoding caller-owned invocation with target release and the 2-source order (OpenSpec official → vercel-labs/skills); verify it never claims scheduling or release detection.
- [x] 5.2 Define the skill's analyze-first and explicit-write flow with review-hash guard; verify evaluations cover release invocation, no-invocation, and no-change runs.

## 6. Regression And Release Verification

- [x] 6.1 Run the existing tool-reference UI, localization, API, detector tests and verify the simplified shared display (`client | OpenSpec | note`) and single source line.
- [x] 6.2 Run `npm test`, `npm run typecheck`, `npm run build`, and `openspec validate externalize-tool-reference-data --strict`; verify all pass and emitted datasets contain no source-tree-only paths.
