## Why

The tool-reference implementation embeds both the pinned OpenSpec table and the Shared `.agents/skills` mapping in TypeScript. `.agents/skills`に対応するAIツールは、OpenSpec公式対応・非対応を問わず1つの共有パスにまとめられるという参考情報を、シンプルな2ソースJOINで表示したい。主ソースは `vercel-labs/skills/src/agents.ts`（`skillsDir === '.agents/skills'` で機械的に取れる集合）で、OpenSpecの `supported-tools.md` とJOINすれば十分。毎回全ツールの公式Docを総当りする必要はない。

## What Changes

- Move the pinned OpenSpec tool-definition snapshot and the Shared `.agents/skills` mapping into separate, schema-versioned JSON files consumed by the server module (`src/server/data/tool-reference/`).
- Preserve the existing reference API (`GET /api/tool-reference`) and detector eligibility; keep data independently maintainable.
- Shared mapping is a flat reference list: `{ id, name, openSpecToolId?, note? }` with a single dataset-level source (`vercel-labs/skills` commit + `updatedAt`). No per-client evidence, lifecycle, or generation machinery.
- Add a lightweight repository maintenance skill under `.agents/skills/update-tool-reference/` that is invoked with a target OpenSpec release/tag and performs a 2-source diff (OpenSpec official → Vercel candidates → union). The skill does not detect releases or schedule itself. Note that `https://github.com/vercel-labs/skills` is the primary provenance for the shared list.
- Keep repository detection on its existing code-owned allowlist so an upstream table update cannot silently change runtime detection.
- Dialog shows OpenSpec source + version link and a single shared source line (`vercel-labs/skills` + revision + updatedAt). Per-row evidence/source/調査日は持たず、行は `client | OpenSpec | 備考` の最小列のみ。

## Capabilities

### New Capabilities
- `tool-reference-maintenance`: Defines the external data contracts for official definitions and Shared `.agents/skills` mapping.

### Modified Capabilities

None. The existing tool-reference API and UI behavior remain unchanged except for simplified shared display.

## Impact

- Adds JSON data under `src/server/data/tool-reference/` emitted via `resolveJsonModule` under `dist/` and included in npm packages.
- Refactors `src/server/tool-compatibility-reference.ts` to validate and expose imported data.
- Adds a repository-local shared Agent Skill under `.agents/skills/update-tool-reference/` and a minimal `scripts/update-tool-reference.mjs`.
- Extends tests for data-schema validation and unchanged API/detection behavior.
