# Design

## Context

See `proposal.md` for motivation. Official tool definitions are a packaged JSON snapshot (`src/server/data/tool-reference/openspec-tools.json`) maintained by `scripts/update-tool-reference.mjs` (analyze-first; write only with `--write --review-hash`). Detection signatures in `src/server/tool-integration-detection.ts` are derived from that snapshot. The current pin is OpenSpec v1.13.1 (`634c557bd0470eec37861b46172c3f503d283c1b`); Kilo Code Commands still resolve to `.kilocode/workflows/opsx-<id>.md`. Antigravity already appends a legacy command directory after the current snapshot path and merges overlapping workflow ids by keeping the first-seen source.

The updater treats `openspec.dataset` as the proposed official snapshot as-is. Conflict records are review metadata; they do not rewrite paths or names. The Shared `.agents/skills` research list is a separate JOIN against caller-supplied Vercel candidates and is not pruned when an OpenSpec pin keeps the previous candidate set.

## Goals / Non-Goals

**Goals:**
- Pin the official snapshot to tag `v1.13.2` / revision `db2309783547a14e150dbcbfc19120e4028446c3` through the existing maintenance workflow, with the same two official-source disagreements recorded and resolved as in v1.13.1, plus the Kilo Code Commands path from the tagged table.
- Derive Kilo Code command detection from the new snapshot path and append the legacy `.kilocode/workflows` signature so repositories that have not run `openspec update` still surface Commands evidence.

**Non-Goals:**
- Refresh, prune, or expand the Shared `.agents/skills` research list (keep revision `435076e78988e1e6ec40d00b0b1d76bdbbc5419a` and the current 33 clients).
- Rename detector labels (`Shared .agents / Codex`) or change Antigravity snapshot paths back to `.agent`.
- Change task parsing, validation JSON handling, apply/archive gating, engines.node, or the detection allowlist.

## Decisions

### Reconcile the official dataset in the updater input

Build `openspec.dataset` from the tagged v1.13.2 table (40 tools), then apply these reviewed resolutions before analysis:

1. **Kilo Code Commands path.** Documentation and release notes both list `.kilo/command/opsx-<id>.md`. Skills stay `.kilocode/skills/openspec-*/SKILL.md`. Invocation stays `/opsx-<id>`. Put the new command path in the input dataset.
2. **`agents` name.** Documentation: "Shared `.agents` skills". Release notes / picker: "Other / Universal". Resolution source: tagged `docs/supported-tools.md`. Keep snapshot `name` as `Shared .agents skills`.
3. **`antigravity` paths.** Tagged table still lists `.agent`; shipped config and the current snapshot use `.agents` with legacy `.agent`. Resolution source: shipped config at the same tag. Keep `.agents`.

Record (2) and (3) in `releaseNotes.conflicts` with non-empty resolutions so the analyzer reports them and `writeAllowed` stays true. Pass the existing Vercel candidates and revision so `added`/`missing` stay empty. `checkedAt` may refresh research `updatedAt` on write; client identity must not change.

Alternative considered: fetch a live `vercel-labs/skills` agent list. Rejected for this pin because current main would add and rename clients (`kilo` vs `kilocode`, `grok` vs `grok-build`) and that is a separate research refresh.

### Append a Kilo Code legacy command signature after the current path

Keep deriving command/skill signatures from the snapshot. For `kilocode` only, append `['.kilocode/workflows', 'filename', 'opsx-dash']` after the current command spec, matching Antigravity's dual-path merge: current directory is scanned first, then legacy fills workflow ids that are not already present. Keep the snapshot skill spec (`.kilocode/skills`); unlike Antigravity, Kilo Code skills are not owned by the shared `.agents/skills` tree.

`getSupportedToolOptions` already prefers the first command form, so the preferred Kilo Code form remains `/opsx-<id>`.

Alternative considered: snapshot-only current path. Rejected because a repository that has not run `openspec update` would lose Commands evidence and look skills-only.

## Risks / Trade-offs

- **[Repositories with both directories after a partial update]** → Prefer `.kilo/command` for overlapping workflow ids; keep unique legacy ids so leftover files still count.
- **[Antigravity tagged-table lag continues]** → Keep reporting it as a reviewable conflict; never silently take `.agent`.
- **[Stale Vercel research list vs current main]** → Accept for this pin; a later change can refresh candidates without blocking the official snapshot.

## Migration Plan

1. Analyze `v1.13.2` with both official sources and the resolutions above; write only after the displayed review hash.
2. Add the Kilo Code legacy command signature and focused detection tests (current, legacy, overlap).
3. Point snapshot assertions at `v1.13.2` and assert the Kilo Code Commands path.
4. Run `npm test`, `npm run typecheck`, `npm run build`, and `openspec validate --all --strict --json`.

Rollback is a source revert of the snapshot, detection signatures, and tests. No project files are migrated.
