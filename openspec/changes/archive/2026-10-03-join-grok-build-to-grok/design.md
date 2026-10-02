# Design

## Context

See `proposal.md` for motivation. Shared `.agents` JOIN lives in `scripts/update-tool-reference.mjs`:

```js
const openSpecToolId = officialIds.has(id) ? id : undefined;
```

Prior records keep `note` only. A hand-edited `openSpecToolId` is discarded on the next write. Official Grok Build is id `grok` with unique path `.grok/skills/openspec-*/SKILL.md`. Vercel research keeps client id `grok-build` because that is the `vercel-labs/skills` agent id. Settings 共有 `.agents` 調査 shows `record.openSpecToolId` as a badge, or 「OpenSpec 表の対象外」 when it is empty. Detection already allowlists `grok`; this change does not touch detection.

## Goals / Non-Goals

**Goals:**
- Resolve `grok-build` to official `grok` in the packaged research snapshot.
- Encode that resolution in the updater so the next official pin cannot wipe it.
- Keep remaining unlinked Vercel clients unlinked.

**Non-Goals:**
- Alias other unlinked clients (`antigravity-cli`, `deep-agents`, `dexto`, `firebender`, `loaf`, `promptscript`, `replit`).
- Change Vercel candidate membership, official catalog pin, detection allowlist, or command chips.
- Preserve arbitrary prior `openSpecToolId` values that are not exact matches or reviewed aliases.
- UI component changes; the dialog already renders the badge from data.

## Decisions

### Keep a code-owned reviewed alias map in the updater

Export a small map from `scripts/update-tool-reference.mjs`:

```js
export const REVIEWED_CLIENT_ALIASES = Object.freeze({
  'grok-build': 'grok',
});
```

Resolve `openSpecToolId` as: exact official id, else alias target when that target is official, else unset. Write `openSpecToolId: grok` on the `grok-build` research record. Tests assert the packaged snapshot, that a rebuild from current Vercel candidates keeps the link, that an alias whose target is missing stays unlinked, and that exact id still wins if official later ships `grok-build`.

Alternative considered: edit JSON only. Rejected because the updater overwrites `openSpecToolId` from exact id and would unlink Grok Build on the next pin.

Alternative considered: preserve any previous `openSpecToolId` that still exists in the official set. Rejected because stale or accidental links would survive a pin without review. Aliases stay explicit.

Alternative considered: fail the whole write when an alias target is missing. Rejected; missing official `grok` should unlink that one client the same way an exact miss does, not block the catalog pin.

### Do not expand the Vercel list or detection

`grok-build` remains the research client id. Official unique-path detection stays on `grok`. JOIN is identity for the reference dialog, not a claim that Grok Build reads `.agents/skills` as its official OpenSpec layout.

## Risks / Trade-offs

- **[Alias hides the id mismatch]** → Keep research `id` as `grok-build` and show official `grok` only in the OpenSpec-link column.
- **[Future official `grok-build` id]** → Exact match wins; the alias is unused for that client.
- **[Other product-name collisions]** → New aliases require their own reviewed change.

## Migration Plan

1. Add the alias map and JOIN helper, write `openSpecToolId` on the research record, update skill wording, and update snapshot/updater tests.
2. Run `npm test`, `npm run typecheck`, `npm run build`, and `openspec validate --all --strict --json`.

Rollback is a source revert of the updater, research JSON, skill, and tests.
