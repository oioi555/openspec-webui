## Context

See `proposal.md` for motivation. The official reference snapshot is currently sourced from only `docs/supported-tools.md`, and the repository skill describes a two-source flow: OpenSpec's table followed by `vercel-labs/skills`. OpenSpec v1.11 exposes a limitation in that model because its release notes and shipped adapter/config identify `.agents` as Antigravity's current root while the tagged supported-tools table still lists `.agent`.

Runtime detection is also table-driven for ordinary tools, but `.agents/skills` is already special-cased because multiple OpenSpec targets share that physical tree. Treating Antigravity as an ordinary v1.11 table row would scan the same current skills twice and could produce both command and skill candidates for one logical tool without applying the existing commands-first rule.

The WebUI invokes `openspec validate --all --strict --json` by default. Under v1.11, three archived Purpose placeholders therefore become real project validation failures even though no runtime code changed.

## Goals / Non-Goals

**Goals:**
- Make release-note inspection a normal, required part of the official OpenSpec reference update workflow.
- Preserve review-first, fail-closed dataset maintenance when official sources disagree.
- Model one logical Antigravity integration across its current shared skills, current commands, and legacy artifacts.
- Preserve current API fields while extending the shared target union with `antigravity`.
- Restore strict validation by authoring the three missing main-spec Purposes.

**Non-Goals:**
- Automatically discover new OpenSpec releases or schedule reference refreshes.
- Replace the static detection allowlist with upstream-controlled runtime behavior.
- Remove legacy `.agent` read support or migrate project files from the WebUI.
- Add the v1.11 `show --diff` or `status --all` features.
- Change validation strictness or suppress the new Purpose diagnostic.

## Decisions

### Treat release notes as a required official source, not an exception

The maintenance skill will load, for the exact caller-selected tag, both the supported-tools document and the GitHub release notes before loading the Vercel candidate source. The two OpenSpec documents form the official-definition input; `vercel-labs/skills` remains the independent source for the shared-client candidate list.

The analysis input/report will carry availability and provenance for both official documents. A disagreement will be emitted as a categorized official-source conflict with the affected tool and fields. The analysis may propose the released behavior using the release notes and shipped release artifacts as corroboration, but writing still requires the existing reviewed hash and explicit approval. An unavailable official document disables writes instead of collapsing into a removal.

Alternative considered: continue using only `supported-tools.md` and encode Antigravity as a one-off exception. Rejected because release notes are formal release data and future migrations can produce the same lag.

### Keep the persisted reference compact while making reconciliation reviewable

The v1.11 JSON snapshot will continue to store one canonical source version/revision and the reconciled current definition set. Detailed source conflicts and their resolution belong in the analyze-first report and skill workflow rather than per-tool evidence fields in the runtime dataset. Tests will require the skill and updater analysis to show that release notes were checked and to fail closed when either official source is unavailable.

Alternative considered: add per-tool provenance arrays and increase the dataset schema version. Rejected because the runtime dialog needs the released definition, while source reconciliation is an operator-maintenance concern and the existing compact schema is sufficient once the review report is authoritative.

### Reconcile Antigravity after scanning the shared root

Detection will preserve explicit signatures for:
- current Antigravity commands: `.agents/workflows/opsx-*`
- legacy Antigravity commands: `.agent/workflows/opsx-*`
- legacy Antigravity skills: `.agent/skills/openspec-*/SKILL.md`
- shared current skills: `.agents/skills/openspec-*/SKILL.md`

The shared marker resolver will accept `antigravity`. When that marker is valid and shared skill artifacts exist, the detector will attach the shared skill inventory to the logical Antigravity integration and will not also expose it as ambiguous Shared `.agents` / Codex evidence. Current commands and current skills can then participate in the existing per-workflow commands-first rule as one tool. If no Antigravity marker exists, `.agents/skills` remains governed by the existing agents/Codex/Zed/legacy rules; the bare root or Antigravity workflows alone do not claim shared-skill ownership.

Legacy `.agent` evidence remains independently detectable. If current and legacy artifacts coexist, inventories will be deduplicated by workflow/skill identity with current paths preferred for representative evidence.

Alternative considered: let both the ordinary Antigravity signature and shared-root signature report `.agents/skills`. Rejected because duplicate logical integrations bypass commands-first resolution and can offer two different commands for the same Antigravity workflow.

### Extend the target contract additively

Server and frontend `SharedSkillTarget` unions will add `antigravity`; no existing value or field is removed. Candidate labeling maps that target to `Antigravity`, restricts its shared skill interpretation to `skill-slash`, and never introduces `skill-dollar` solely from the shared path. Existing legacy fallback behavior remains unchanged for absent, unreadable, and unknown markers.

### Update authored Purposes directly in main specs

The `cli-runtime`, `live-refresh`, and `task-tracking` Purposes will be edited directly in their main specs, as required by v1.11. They will describe the existing capabilities without changing requirements. These edits are intentionally not represented as delta requirements because archive ignores a Purpose in a delta for an existing capability.

## Risks / Trade-offs

- **[Official sources can remain inconsistent after release]** → Surface the conflict with both references, corroborate against shipped release behavior, and require explicit reviewed approval.
- **[Shared-root merging could misattribute generic skills to Antigravity]** → Merge only when matching skills exist and the marker value is exactly `antigravity`; workflows without matching artifacts remain unavailable.
- **[Current and legacy files can duplicate workflows]** → Deduplicate by canonical workflow or skill id and prefer current-path evidence deterministically.
- **[Adding a union member can reveal missed exhaustive branches]** → Update server/frontend types and add focused tests for marker resolution, labels, forms, and API serialization.
- **[Purpose edits are direct main-spec changes outside delta sync]** → Limit them to the three diagnosed lines and verify the entire project with v1.11 strict validation.

## Migration Plan

1. Update and verify the maintenance skill/updater behavior before replacing the pinned dataset.
2. Refresh the official snapshot to v1.11 with the source disagreement recorded in the reviewed maintenance output.
3. Add detector and candidate support while retaining legacy paths.
4. Replace the three Purpose placeholders.
5. Run focused tests, the full test/typecheck/build suite, and `openspec validate --all --strict --json`.

Rollback is a normal source revert. No project artifacts are migrated or deleted by the WebUI, so rollback does not require data restoration.
