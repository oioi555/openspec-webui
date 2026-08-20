## Context

See `proposal.md` for motivation. The current `src/server/tool-compatibility-reference.ts` owns two large inline arrays. The server must continue to operate offline from an installed npm package, and source updates must not silently alter detection.

The compiler already uses `rootDir: src`, `resolveJsonModule: true`, and `NodeNext`; JSON imported from `src/server/data/` is emitted under `dist/` and is therefore included by the existing npm `files: ["dist/"]` policy.

Primary provenance for the shared list is `vercel-labs/skills`:
- `.agents/skills` 対応Agent一覧の主ソース = `vercel-labs/skills/src/agents.ts` (`skillsDir === '.agents/skills'` で universal として分類)
- OpenSpec対応一覧 = OpenSpec `docs/supported-tools.md` at pinned release
- JOINして `Tool | .agents対応 | OpenSpec対応 | OpenSpec ID` を表示、注意書きに `https://github.com/vercel-labs/skills` を明記

## Goals / Non-Goals

**Goals:**
- Make both datasets independently editable and diffable without editing TypeScript.
- Keep the shared mapping minimal: flat list with single dataset-level source and optional per-client note (e.g. Hermes global要設定).
- Make routine updates a 2-source diff (OpenSpec release + vercel-labs/skills Supported Agents) unless an operator explicitly requests a refresh.
- Provide a lightweight skill with dry-run-first behavior.
- Preserve current API/UI output and detector eligibility during migration, while simplifying the shared dialog to `client | OpenSpec | note`.

**Non-Goals:**
- Schedule autonomous jobs or depend on a hosted database.
- Detect OpenSpec releases or decide when automation should invoke the maintenance skill.
- Require per-client vendor-doc総当り for the reference. Individual公式Doc確認は気になる時だけで良い.
- Retain per-client evidence, lifecycle, alias, or generation machinery.

## Decisions

### Use two JSON files under the compiled server source tree

Add:

```text
src/server/data/tool-reference/
├── openspec-tools.json
└── shared-agents-research.json
```

`openspec-tools.json` contains only the pinned upstream definition snapshot:

```json
{
  "schemaVersion": 1,
  "source": {
    "url": "https://github.com/Fission-AI/OpenSpec/blob/v1.10.0/docs/supported-tools.md",
    "revision": "v1.10.0",
    "version": "v1.10.0",
    "checkedAt": "2026-08-20"
  },
  "tools": []
}
```

`shared-agents-research.json` contains the minimal mapping:

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-08-21",
  "source": {
    "url": "https://github.com/vercel-labs/skills",
    "revision": "435076e...",
    "updatedAt": "2026-08-21"
  },
  "clients": [
    { "id": "cursor", "name": "Cursor", "openSpecToolId": "cursor" },
    { "id": "hermes", "name": "Hermes Agent", "openSpecToolId": "hermes", "note": "グローバル共有パスは要設定" }
  ]
}
```

No per-client `research`, `evidence`, `lifecycle`, `aliases`, or generation. The dialog shows the single `updatedAt` and single `source` line, not per-row 調査日.

Alternative considered: keep generated TypeScript — mixes data review with code diffs.

Alternative considered: root-level `data/` — would require extending npm package files.

### Keep the detector allowlist code-owned

`tool-integration-detection.ts` continues to own `DETECTED_TOOL_IDS`. Validation asserts that every allowlisted id exists. A new official id remains reference-only until the allowlist is intentionally changed.

### Split deterministic mechanics from research

Add a shared repository skill at `.agents/skills/update-tool-reference/SKILL.md`. The skill does a 2-source diff: load official snapshot for the caller-selected release, read vercel-labs/skills Supported Agents, union to produce the flat client list, validate, and print a categorized diff. Evidence age alone never queues work; no fixed deadline.

The skill runs in two phases:

```text
analyze (default)  -> validate, print diff + review hash, no writes
write (explicit)   -> revalidate, write both JSON files
```

### Validate at import and maintenance boundaries

The server validates imported data before exposing it. The maintenance script validates proposed output before writing. Build coverage verifies `dist/server/data/tool-reference/*.json` exist and the API loads offline.

## Risks / Trade-offs

- [External JSON can drift from types] → Validate at import.
- [Official table shape changes] → Pin immutable revisions, fail loudly.
- [A source outage looks like removals] → Track per-source availability; unavailable source makes the run not writable and never drives removals.
- [JSON imports behave differently] → Cover NodeNext import attributes in build tests.

## Migration Plan

1. Define minimal schema types and validators.
2. Move the exact official and shared arrays into separate JSON files and prove semantic equality with snapshot tests.
3. Switch the server module to validated imported data; verify all API/UI regressions remain unchanged.
4. Simplify the dialog to `client | OpenSpec | note` with single source line.
5. Add minimal validation/diff script and a lightweight skill.
6. Add build/package smoke tests for emitted JSON and offline API loading.

Rollback is data-preserving: restore the prior inline module from version control while retaining the JSON files.
