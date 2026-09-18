# Design

## Context

See `proposal.md` for motivation. Task progress is parsed locally in `src/parser/tasks.ts` and consumed by change listing, the dashboard aggregate, ChangeViewer, and apply/archive gating. The current regex is hyphen-only and requires a space-or-x marker plus non-empty text. OpenSpec v1.13.1's `TASK_LINE_PATTERN` in `src/utils/task-progress.ts` is the line-recognition source of truth; the CLI itself stays flat and does not build a tree.

The official tool snapshot is a packaged JSON file maintained by `scripts/update-tool-reference.mjs` (analyze-first, write after `--review-hash`). Tagged `docs/supported-tools.md` at v1.13.1 still lists 40 tools, still names `agents` "Shared `.agents` skills", and still lists Antigravity under `.agent`. Shipped `AI_TOOLS` at the same tag uses `.agents` for Antigravity (legacy `.agent`) and names the vendor-neutral picker "Other / Universal (shared .agents skills)". GitHub release notes call that picker "Other / Universal" and call out the task-progress fix; they do not revert the Antigravity path.

## Goals / Non-Goals

**Goals:**
- Port the v1.13.1 task-line pattern into the existing indent-stack parser so progress totals match the CLI on the same file.
- Keep the WebUI task tree (indent nesting + 1-based line numbers) for rendering.
- Pin the official snapshot to tag `v1.13.1` / revision `634c557bd0470eec37861b46172c3f503d283c1b` through the existing maintenance skill, with reviewable resolutions for the two official-source disagreements.

**Non-Goals:**
- Flatten the WebUI task tree to match CLI storage.
- Skip fenced or commented checkboxes (CLI counts them).
- Change detector labels, command-shortcut forms, or the shared-root identity `Shared .agents / Codex`.
- Discover namespaced change folders (`changes/<namespace>/<name>/`).
- Reimplement CLI validation, archive, or status Next-step text.

## Decisions

### Port the official line pattern; keep indent as a WebUI capture

Replace the hyphen-only regex with the v1.13.1 `TASK_LINE_PATTERN`, wrapping a leading-whitespace capture in front of the list marker so the existing parent-stack logic still works:

```
/^(\s*)(?:[-*+]|\d{1,9}[.)])\s*\[(?:\s*([^\]\s]?)\s*\](?![([])|\s+\])\s*(.*)/
```

- `completed` is `(marker ?? '').toLowerCase() === 'x'`
- `text` is the description capture, trimmed (may be empty)
- `line` remains 1-based
- Do not anchor `$`, so a trailing `\r` after `split('\n')` is trimmed rather than rejected

Alternative considered: call the CLI for progress. Rejected because the WebUI already parses files locally for the tree and line numbers, and progress must stay available offline from the same parse.

### Count every matching line; nest only for display

CLI progress is a flat count. WebUI progress walks the tree recursively. If every matching line is inserted into the tree (including mixed `-` / `*` / `+` / `1.` children), the recursive totals equal the CLI totals. Indent comparison stays character-length of leading whitespace, as today.

Alternative considered: keep hyphen-only nesting and add a second flat counter. Rejected because two counts would drift in the UI.

### Resolve tool-reference conflicts toward tagged docs for names and shipped config for Antigravity paths

Maintenance input is tag `v1.13.1`. Construct the proposed official dataset from the tagged table, then apply these reviewed resolutions:

1. **`agents` name.** Documentation: "Shared `.agents` skills". Release notes: "Other / Universal". Shipped picker: "Other / Universal (shared .agents skills)". Resolution source: tagged `docs/supported-tools.md`. Keep snapshot `name` as `Shared .agents skills`. Detector/command labels stay `Shared .agents / Codex`.
2. **`antigravity` paths.** Documentation still lists `.agent/skills` and `.agent/workflows`. Shipped v1.13.1 `AI_TOOLS` uses `skillsDir: '.agents'` with `legacySkillsDirs: ['.agent']`. The current snapshot already stores `.agents`. Resolution source: shipped config at the same tag (same resolution as v1.11). Do not regress to `.agent`.

If the tools array is otherwise identical, still rewrite source provenance (`version`, `revision`, `url`, `checkedAt`). `docs-lab` copy is not an official source.

Alternative considered: rename the catalog row to "Other / Universal". Rejected because the tagged supported-tools table is the snapshot's documented source, the rename is picker copy, and detector identity is a different string.

## Risks / Trade-offs

- **[Over-counting one-token non-tasks such as `- [1] leftover]`** → Accept the same trade as CLI: a loud false positive is preferred to silently dropping unfinished work.
- **[Empty-description rows render blank in the task tree]** → Keep them; they count toward progress and apply/archive gating.
- **[Antigravity tagged-table lag returns on later releases]** → Keep reporting it as a reviewable conflict until tagged docs catch up; never silently take `.agent`.
- **[Catalog name and init picker disagree]** → Documented in the maintenance review; UI detector labels are unchanged so command generation does not shift.

## Migration Plan

1. Update `src/parser/tasks.ts` and add focused parser tests for the v1.13.1 cases, including a hyphen-only nested fixture that must keep today's totals.
2. Run the tool-reference analyzer against v1.13.1 with both official conflicts recorded and resolved as above; write only after the displayed review hash.
3. Point the snapshot test at `v1.13.1` while keeping the 40-id set and Antigravity `.agents` paths.
4. Run `npm test`, `npm run typecheck`, `npm run build`, and `openspec validate --all --strict --json`.

Rollback is a source revert of the parser, tests, and JSON snapshot. No project files are migrated.
