## Context

The WebUI currently copies OpenSpec commands using a single persisted format (`standard` → `/opsx-<id>`, `claude-code` → `/opsx:<id>`, `skill` → `/openspec-<skill>`). The format lives in `frontend/src/lib/state/commandPreferencesCore.ts` under localStorage key `openspec-command-preferences` (`format` field, with legacy `aiTool` values like `default` normalized to `standard`). `commandShortcuts.ts` holds a hardcoded `SKILL_NAMES` table and `buildCommand()`, and `commandTypes.ts` splits commands into `CORE_COMMANDS` / `EXPANDED_COMMANDS`. `CommandShortcutBar.svelte` copies immediately on chip click.

Availability comes from `src/server/openspec-config.ts` (`openspec config get workflows`), which filters `onboard` and derives `availableExpandedCommands` from a hardcoded expanded list. The Settings `Workflow` section (in `SettingsView.svelte`) renders the three format option cards plus a supported-tools docs link; the Commands section renders core/expanded visibility toggles.

Per the official OpenSpec docs (`docs/supported-tools.md`), `openspec init` writes tool-specific artifacts into the repository (e.g. `.claude/commands/opsx/<id>.md`, `.cursor/commands/opsx-<id>.md`, `.amazonq/prompts/opsx-<id>.md`, `.claude/skills/openspec-*/SKILL.md`) and each tool spells the same workflow differently. There are exactly six official invocation shapes: `/opsx:<id>`, `/opsx-<id>`, `@opsx-<id>`, `/openspec-<skill>`, `/skill:openspec-<skill>`, `$openspec-<skill>`. Workflow ids and skill names are not 1:1 (`sync` → `openspec-sync-specs`, `apply` → `openspec-apply-change`).

See proposal.md — Why for motivation. The behavior contract is in the delta specs (command-preferences, command-shortcuts, tool-integration-detection).

## Goals / Non-Goals

**Goals:**
- Replace the persisted single-format model with per-copy invocation-form candidates derived from repo detection.
- Detect OpenSpec-generated per-tool commands/skills in the active repo as hints (never authority), with empty dirs ignored and zero-detection never disabling copy.
- Make the CLI `workflows` list the single source of truth for availability; stop using the core/expanded dichotomy for display decisions; keep `onboard` blocked.
- Classify workflows by whether the WebUI can identify the target from the copy surface: workspace-only (`propose`, `explore`, `new`, `bulk-archive`) vs change-only (`continue`, `ff`, `apply`, `update`, `verify`, `sync`, `archive`); move `update` and remove `continue`/`ff` from the workspace row accordingly, with `update` labeled `Revise Plan`.
- Evolve the availability API additively (`delivery`, detected integrations, forms) with staged deprecation of `availableExpandedCommands`.
- Rename the Settings section to `Tools` as a read-only surface with docs link, `openspec init` guidance, detected-integration list, and refresh.

**Non-Goals:**
- No 37-tool catalog, generic adapter registry, arguments schema, or `multi-change` scope (workflow metadata stays minimal: id, label, scope, skill name).
- No auto-detection of whether the user's AI tool is installed — detection targets OpenSpec-generated artifacts only.
- No remembered-last-format auto-copy and no global/repo/command-level format fixing.
- No changes to `onboard` blocking policy.
- No changes to validation, package/release surface, or project registry behavior.
- No removal of the existing clipboard/copy UX primitives.

## Decisions

**D1: Retire the format preference; keep visibility preferences.**
`CommandFormat` (`standard | claude-code | skill`) is removed from the persisted preferences model. `commandVisibility` (per-command on/off) stays exactly as-is under the same storage key. On load, stored `format` and legacy `aiTool` values are ignored; on the next preferences write, the retired fields are dropped from the stored object. This is a pure additive migration: users never lose visibility settings, and no format value is ever consulted during generation.
*Alternative considered:* mapping legacy `format` to a detected candidate — rejected because per-copy selection makes a persisted format meaningless and the agreed model forbids unconfirmed auto-copy.

**D2: Six official invocation forms are first-class, each interpolating id or skill name.**
The invocation-form set is exactly: `/opsx:<id>`, `/opsx-<id>`, `@opsx-<id>`, `/openspec-<skill>`, `/skill:openspec-<skill>`, `$openspec-<skill>`. Forms are described declaratively (prefix + whether they interpolate the workflow id or the workflow's skill name), so a form is a small data record — not a function per tool. Skill names come from the centralized workflow metadata (D3), matching the official "Generated Skill Names" list (`openspec-sync-specs`, `openspec-apply-change`, `openspec-update-change`, etc.).
*Alternative considered:* deriving skill names algorithmically — rejected; official naming is irregular and defined upstream.

**D3: One workflow-metadata module is the single source for id, label, scope, skill name.**
A single frontend module (`workflowMetadata.ts`) holds a record for every surfaced workflow: `id`, user-facing label, `scope: 'workspace' | 'change'`, and `skillName`. It replaces the current split (`SKILL_NAMES` in commandShortcuts.ts, `CORE_COMMAND_LABELS`/`EXPANDED_COMMAND_LABELS` in commandTypes.ts, label mapping in uiText.ts). Command generation, candidate menus, and the Tools section all read from it.

The scope classification criterion is **whether the WebUI can identify the command's target from the copy surface**, not whether the CLI accepts an optional `[change-name]`. The official CLI makes `[change-name]` optional for change workflows because the CLI can infer the target from conversation context; the WebUI has no conversation context, so a workflow is change-only exactly when it targets a single existing change that a Change surface can name. On that basis: `propose`, `explore`, `new`, `bulk-archive` are workspace-only (new/free-form input or multiple-change selection — no single existing change row implies them); `apply`, `continue`, `ff`, `update`, `verify`, `sync`, `archive` are change-only (each targets one existing change, and Change surfaces always append the known change name). `onboard` has no entry (consistent with the blocked policy). `bulk-archive` stays `workspace` — there is no `multi-change` scope. This classification is consistent with the official command reference: CLI argument optionality is a convenience, not the surface criterion.
*Alternative considered:* mirroring CLI argument optionality in the metadata — rejected; it does not tell the WebUI where to render a command.
*Alternative considered:* keeping per-file lookup tables — rejected; requirement 6/7 mandates one place, and the tools surface must render the same labels as the copy UI.

**D4: Detection is repo-scoped, artifact-based, and advisory only.**
A new server module scans the active project root for OpenSpec-generated artifacts: known tool roots (`.claude/`, `.cursor/`, `.amazonq/`, `.devin/`, `.windsurf/`, `.agents/`, `.codex/`, `.opencode/`, `.github/`, `.continue/`, `.kimi-code/`, `.trae/`, `.roo/`, `.qwen/`, …) with `skills/openspec-*/SKILL.md` directories (non-empty) and `opsx-*` command files. The scan maps each detected root to a tool name and delivery (Commands / Skills / both) and to the invocation form that root's file shape implies (folder-namespaced `opsx/<id>` → `/opsx:<id>`; filename `opsx-<id>` → `/opsx-<id>`; `.amazonq/prompts` → `@opsx-<id>`; skills-only roots → skill forms; `.kimi-code` → `/skill:openspec-*`; `.codex`/`.agents` → `$openspec-*`). Empty directories (no command files / no `SKILL.md`) are never reported. Results are hints: zero detections leave copy fully functional, and a non-detected tool is never labeled unsupported.
A shared `.agents/skills` tree is inherently ambiguous: the official Codex target invokes it as `$openspec-*`, while the vendor-neutral Shared `.agents` target invokes the same generated path as `/openspec-*`. Repository artifacts cannot distinguish those targets. Detection therefore reports one neutral `Shared .agents / Codex` integration and contributes both `skill-slash` and `skill-dollar` candidates. This forces explicit copy-time selection instead of incorrectly taking the single-form direct-copy path.
This refines the archived decision D5 in `2026-04-16-skill-format-support` ("Skill availability is determined by user installation, not repo contents"): we still never infer *tool support* from repo contents and we never treat absence as unsupported — but OpenSpec-generated artifacts present in the repo are legitimate evidence of which integrations this repo is configured for, so they are surfaced as copy-candidate hints. The WebUI's `SKILL_NAMES`-style metadata remains "how to spell a workflow", not a probe of what the user has installed. (Note: the agreed requirement cited `2026-08-10-support-openspec-v1-8` D5; that change's D5 concerns the Dashboard Store badge. The "don't infer skill support from repo contents" decision lives in `2026-04-16-skill-format-support` D5, which is the one refined here.)
*Alternative considered:* letting the frontend glob the repo — rejected; the server owns filesystem access and the API is the existing boundary for availability.
*Alternative considered:* treating detection as authoritative (hiding undetected forms) — rejected; that recreates the D5 problem and contradicts the agreed hint semantics.

**D5: Copy-time candidate selection: single → direct, multiple → menu, zero → all six + `Other format…`.**
When detection yields exactly one distinct invocation form, the current direct-copy behavior is preserved. When multiple distinct forms exist, activating a chip opens a candidate menu and copies only after explicit selection. When zero forms are detected, the menu offers all six official forms. `Other format…` exposes undetected/custom formats. Candidate entries dedupe by output string: tools producing identical text (e.g. two tools using `/opsx-<id>`) collapse into one menu entry, while the Tools section lists each tool individually. There is no last-format memory — every multi-candidate activation re-opens the menu. Argument appending follows D3 scope: workspace-only commands copy with no positional argument; change-only commands append the known change name (see D6).
*Alternative considered:* persisting the last chosen form — rejected (explicit "no unconfirmed auto-copy" requirement).

**D6: `update` and `continue`/`ff` become change-only; availability gates on CLI `workflows`.**
Under the D3 surface criterion, `update`, `continue`, and `ff` are change-only: each targets a single existing change, so the workspace command row (which cannot name a change) never renders them. `update` joins the change-scoped commands for any active, unarchived change in both task states, labeled `Revise Plan` (distinct from the CLI `openspec update`), copied with the change name. `continue` and `ff` remain change-scoped for incomplete changes only, likewise copied with the change name. Because the official CLI treats `[change-name]` as optional (conversation-context inference) while the WebUI always knows the target from the surface it is rendered on, appending the known change name is not a contradiction: it is the WebUI's replacement for context inference, and the copied strings remain valid CLI input. Display ordering for incomplete changes is `apply`, `update`, `continue`, `ff`, `sync`; for completed changes `verify`, `update`, `sync`, `archive`. Separately, every command's visibility is now gated by membership in the CLI-reported `workflows` list (plus the existing visibility preference); the core/expanded dichotomy no longer determines display. This fixes the current real-harm bugs: `update` shown at workspace scope, `continue`/`ff` shown at workspace scope, and expanded commands shown based on a hardcoded list instead of the CLI truth.
*Alternative considered:* keeping `update`/`continue`/`ff` in the workspace row but relabeling — rejected; each targets a single existing change that the workspace surface cannot name, so the D3 criterion classifies them change-only.

**D7: API evolves additively; `availableExpandedCommands` becomes deprecated.**
`GET /api/commands/availability` keeps its existing shape and adds: `delivery` (from `openspec config get delivery`, e.g. `both`), `integrations` (detected tools: name, delivery, example invocation, source), and `forms` (deduplicated distinct invocation-form candidates). `availableExpandedCommands` remains present during the staged migration but is marked deprecated and will be removed in the cleanup phase; the client stops using it for display. `onboard` filtering at the server boundary is unchanged (defense in depth with client-side filtering stays).
*Alternative considered:* a brand-new endpoint — rejected; the availability endpoint is the natural home and the frontend already fetches it per project.

**D8: Settings section renamed `Workflow` → `Tools`, read-only.**
The sidebar label becomes the short `Tools` (page heading may be more descriptive, e.g. "Tools & Integrations"). The section renders: a short mechanism explanation, the shared supported-tools docs link constant (`OPENSPEC_SUPPORTED_TOOLS_DOCS_URL` already exists in `openspecDocs.ts`), guidance to re-run `openspec init` to add/remove repo integrations, the detected-integration list (tool, Commands/Skills delivery, example invocation, source), and a refresh control that re-runs detection. Copy uses "OpenSpec integrations configured for this repository", never "installed tools". No format-fixing or selection controls render here. The Commands section (visibility toggles incl. `sync`/`update`, `onboard` hidden) is unchanged.

**D9: Staged rollout (implementation order).**
1. Bug fixes: `update` scoping/label + `continue`/`ff` workspace removal, `sync` availability truth, CLI `workflows` gating (D6).
2. Server detection + API (D4, D7) — additive fields, no client dependency yet.
3. Frontend invocation model: workflow metadata module + six forms (D2, D3), candidate generation with dedupe.
4. Tools UI + copy-time selector (D5, D8), wired to the API additions.
5. Cleanup: remove `CommandFormat`, legacy normalization, `availableExpandedCommands` client usage; finalize deprecation.

## Risks / Trade-offs

- [Detection table drifts from upstream `supported-tools.md` (new tools, renamed dirs, e.g. Windsurf → Devin)] → Mitigation: the detection map lives in one server module with the official doc as its source; unknown roots are simply not detected (non-blocking); the Tools link points to the living official doc as authority.
- [`.agents/skills` shared root ambiguity (Codex vs vendor-neutral)] → Mitigation: detection reports a neutral shared integration and contributes both `/openspec-*` and `$openspec-*` candidates, forcing explicit selection rather than guessing.
- [CLI `config get workflows`/`delivery` shape changes] → Mitigation: defensive parsing with structured diagnostics, consistent with existing `inspectCommandAvailability` behavior; failure degrades to `unavailable`, never an app error.
- [Multi-candidate menu adds a click to a previously one-click flow] → Mitigation: single-detected-form path keeps direct copy; only genuinely ambiguous repos pay the menu cost.
- [Removing the format preference surprises existing users] → Mitigation: migration preserves visibility preferences; the Tools section explains the new mechanism and links official docs; stored values are silently retired, never error.
- [Label drift for `update` ("Revise Plan") vs upstream naming] → Mitigation: label lives in the centralized workflow metadata with the CLI-vs-workflow distinction documented; tests pin it.

## Migration Plan

Backwards compatible and staged. localStorage: `openspec-command-preferences` keeps `commandVisibility`; retired `format`/`aiTool` values are ignored on read and dropped on next write — no data loss. API: additive fields first (`delivery`, `integrations`, `forms`), `availableExpandedCommands` retained as deprecated during migration and removed only in the final cleanup phase; the frontend switches off of it in phase 3/4. Behavior: single-detected-form repos keep today's one-click copy; multi-form and zero-form repos get the candidate menu. Rollback: reverting phases 1–2 restores the previous availability semantics; phases 3–5 are additive UI/model changes with no schema migration. No new npm dependencies.

## Open Questions

- Whether `Other format…` should persist its last free-form entry for the current session — deferred; the spec only requires the entry to exist and forbids unconfirmed auto-copy.


---

## Revisions

| 日期 | 类型 | 变更描述 | 原因 | 影响 API |
|------|------|----------|------|----------|
| 2026-08-10 | behavior | DashboardのChangeコマンド領域を詳細画面へのナビゲーション対象から外し、コピー候補の表示単位を技術的なinvocation formからユーザーが認識するtool identityへ変更する。異なるtoolが同一文字列を生成してもtool選択肢は維持し、format ID/prefixは内部情報として扱う。 | 実装後の実使用で、Dashboard上のコマンド操作がChange詳細へ遷移して二重操作を要求し、copy menuがtoolではなくformatを表示していたため。 | - |
