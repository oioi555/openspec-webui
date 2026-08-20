---
name: update-tool-reference
description: Update pinned OpenSpec tool definitions and the .agents/skills mapping from vercel-labs/skills Supported Agents. Use for OpenSpec releases and reference refreshes. Never detect releases or schedule itself.
compatibility: Requires network for official sources, Node.js 20+, and this repository's scripts/update-tool-reference.mjs.
---

# Update Tool Reference

Join two sources to update the reference data. Primary source is `vercel-labs/skills`, official definitions are OpenSpec.

## Preconditions

1. Require the caller to provide the target OpenSpec release/tag. If absent, stop and ask for it.
2. Do not poll GitHub, detect releases, schedule a future run, or start automation. The caller owns invocation timing.
3. Default to analysis only. Never write data until the proposed diff and review hash have been shown and the caller explicitly approves the write.

## Source order

1. Fetch `docs/supported-tools.md` from the exact caller-selected OpenSpec release/tag. Build the official definition snapshot first.
2. Read the `vercel-labs/skills` Supported Agents source (e.g. `src/agents.ts` with `skillsDir === '.agents/skills'`) only to discover candidates. See https://github.com/vercel-labs/skills
3. Union with previous records so missing clients can be reported instead of silently deleted.

Vercel membership proves only that a client is a candidate for `.agents/skills`. No exhaustive per-client vendor-doc sweep is required for this reference. Keep a short note only for exceptions (e.g. Hermes global requires config).

## Build the analysis input

Create a temporary JSON input outside the repository with:

```json
{
  "targetRelease": "vX.Y.Z",
  "checkedAt": "YYYY-MM-DD",
  "openspec": { "available": true, "dataset": {} },
  "vercelSkills": {
    "available": true,
    "url": "https://github.com/vercel-labs/skills",
    "revision": "commit-sha",
    "candidates": [{ "id": "client-id", "name": "Client Name" }]
  }
}
```

## Analyze

Run:

```bash
node --import tsx scripts/update-tool-reference.mjs --input <temporary-input.json> --json
```

Present the target release, source revisions, unavailable sources, added/missing clients, and review hash. A no-change run stops here without rewriting files.

## Write only after approval

After the caller explicitly approves the displayed diff, rerun:

```bash
node --import tsx scripts/update-tool-reference.mjs \
  --input <temporary-input.json> \
  --write \
  --review-hash <displayed-sha256>
```

The command validates both datasets and writes them. If the hash or datasets changed, return to analysis.

## Verify

Run all of:

```bash
npm test
npm run typecheck
npm run build
openspec validate externalize-tool-reference-data --strict
```

Confirm `dist/server/data/tool-reference/` contains both JSON files.

## Report

Report what changed, source failures, and whether a write occurred. Never describe absence from the list as proven non-support. Primary provenance for the shared list is `vercel-labs/skills`.
