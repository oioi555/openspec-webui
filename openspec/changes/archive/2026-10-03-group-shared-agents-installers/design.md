# Design

## Context

See `proposal.md` for motivation. The compact table in Settings 「共有 .agents 調査」 is static HTML in `ToolCompatibilityDialog.svelte`. After a rejected presentation that listed only `agents` and `zed` plus Codex, the table still hardcodes those two rows. The dialog already loads `reference.officialDefinitions` on both tabs. The pinned catalog (`src/server/data/tool-reference/openspec-tools.json`) currently records six tools whose `skills.path` contains `.agents/skills`: `amp`, `antigravity`, `codex`, `gsd`, `zed`, and `agents`. Codex is the only one whose `skills.invocation` starts with `$`. Zed’s invocation includes `/` and `@`; compact display stays `/openspec-*`. Antigravity also has `.agents/workflows` commands; those belong on the official tab, not in this summary. Tagged docs still list Antigravity under `.agent`; this table follows the pin.

`drop-antigravity-from-shared-agents-summary` encoded the rejected intent. This change supersedes it. Do not archive that change; delete its uncommitted folder after this change’s artifacts exist so two contradictory deltas do not sit together.

## Goals / Non-Goals

**Goals:**
- Derive compact-summary membership from unfiltered pinned official definitions whose skills install into `.agents/skills`.
- Group slash-style installers on one row and keep Codex as the dollar-style exception.
- Caption the table so one official setup (generic `agents` or a main tool) is enough for the research-list `.agents` clients.
- Keep workflows and legacy `.agent` out of the compact table.

**Non-Goals:**
- Re-pin official `openspec-tools.json` or resolve the tagged `.agent` vs shipped `.agents` conflict.
- Change detection, JOIN aliases, Vercel searchable rows, command chips, or package version.
- Add a third compact row for Zed’s `@` form.
- Mix this work into `update-dependencies-2026-10-03`, `support-openspec-v1-14-0`, or `join-grok-build-to-grok`.

## Decisions

### Derive membership from the pin, group by invocation prefix

Add `groupSharedAgentsSkillInstallers` in `frontend/src/lib/toolCompatibilityReference.ts`. A definition belongs when `skills.path` includes `.agents/skills`. Invocation trim starting with `$` is the dollar group; everything else with a matching path is slash (covers Zed `/ or @`). Badge order: `agents` first, remaining ids alphabetical. Compact path is `.agents/skills`. Compact invocation styles are `/openspec-*` and `$openspec-*`. Slash badges use `secondary`; Codex uses `outline`.

The dialog MUST pass `reference?.officialDefinitions`, not the search-filtered `officialDefinitions` derived list, so typing in the search box does not hide installer badges.

Alternative considered: keep hardcoded rows and add Amp/Antigravity/GSD by hand. Rejected; the next pin would drift again.

Alternative considered: follow tagged `.agent` docs and keep Antigravity out. Rejected; the operator boxed the official-tab Amp and Antigravity skills at `.agents/skills` and asked to group those catalog tools.

### Caption carries the unlock meaning

Add `tool_reference_shared_installers_intro` in all seven locales. Japanese copy states that these official targets install into shared `.agents/skills`, that the list below’s `.agents` clients can then use them, and that Codex is the `/` exception. Do not claim a local executable is installed.

Alternative considered: encode the unlock meaning only in badge grouping. Rejected; the grouping alone does not say that one main-tool setup is enough.

### Delete the rejected change folder instead of rewriting it

`openspec-update-change` forbids rewriting a change whose intent flipped. Two active MODIFIED deltas on the same requirement would archive in conflicting order. After this change’s artifacts exist, delete `openspec/changes/drop-antigravity-from-shared-agents-summary`. Active change folders are gitignored.

## Risks / Trade-offs

- **[A later pin may add or drop `.agents/skills` tools]** → Deriving from the pin is the intended sync; helper tests cover slash vs dollar vs non-shared paths.
- **[Tagged Antigravity docs still say `.agent`]** → Official tab keeps the pin; compact membership follows `skills.path`; no workflows / `.agent` row.
- **[Search on the shared tab previously could not change the hardcoded table]** → Unfiltered definitions keep that property.

## Migration Plan

1. Add the grouping helper and tests.
2. Rewrite the compact table to iterate groups, add the caption, compile i18n, and update dialog/locale tests.
3. Delete the superseded `drop-antigravity-from-shared-agents-summary` folder.
4. Run `npm test`, `npm run typecheck`, `npm run build`, and `openspec validate --all --strict --json`.
5. Verify the compact table in the browser on the running `:3002` server.

Rollback is a source revert of the helper, dialog, i18n keys, tests, and this change’s artifacts.
