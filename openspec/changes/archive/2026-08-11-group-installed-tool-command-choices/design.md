## Context

The current detector reduces each tool to one representative `form` and `source`, even when both Commands and Skills are present, and the frontend expands a static supported-tool catalog whenever detection is empty. `CommandShortcutBar` then keeps `(tool, form)` entries distinct, so identical command strings appear repeatedly and an `Other tool…` path exposes integrations absent from the repository. See `proposal.md` and the two delta specs for the intended behavior.

Detection must become workflow-specific because a partially updated repository can contain some OpenSpec command or skill artifacts but not others. A repository-level statement such as “OpenCode Commands exists” is insufficient to decide whether `apply`, `sync`, or another individual shortcut is usable.

## Goals / Non-Goals

**Goals:**

- Preserve exact repository-local artifact evidence for every detected tool and delivery.
- Resolve one effective delivery per tool and workflow, using matching Commands evidence before matching Skills evidence.
- Group copy choices by final generated command text while preserving all associated tool names.
- Make zero or partial detection remove only the shortcuts unsupported by current artifacts.
- Keep the filesystem-ambiguous shared `.agents/skills` root explicit and limited to its two documented interpretations.

**Non-Goals:**

- Detect whether an AI tool executable is installed globally.
- Persist a preferred tool, delivery, or invocation form.
- Allow arbitrary/custom commands from command shortcut menus.
- Change workflow visibility preferences or workflow-to-skill-name metadata semantics.

## Decisions

### 1. Return artifact inventories instead of one representative artifact

Extend each detected integration with optional Commands and Skills inventories. A Commands inventory carries its invocation form plus workflow ids and source paths derived from all matching command files. A Skills inventory carries its invocation form plus skill names and `SKILL.md` source paths. Keep existing aggregate fields temporarily if compatibility requires them, but mark them as legacy presentation data and stop using them for candidate eligibility.

This preserves dual-delivery and partial-update evidence without moving workflow metadata into the server. The frontend already owns the canonical mapping from workflow id to OpenSpec skill name and can match `workflow.id` against command ids or `workflow.skillName` against detected skill names.

Alternative considered: return one effective form per tool. Rejected because effectiveness differs by workflow when generated artifacts are incomplete.

### 2. Apply Commands-first priority independently for each workflow

For a requested workflow, candidate resolution checks whether the tool's Commands inventory contains that workflow id. If so, it uses the Commands form. Otherwise it checks for the resolved skill name in the Skills inventory and uses the Skills form. If neither matches, that tool contributes no candidate for the workflow.

This preserves the existing Commands-first rule without presenting a second delivery choice, while still allowing an installed skill to work when the corresponding command file is absent.

Alternative considered: choose one delivery for the entire repository or tool. Rejected because it would hide usable per-workflow artifacts after partial updates.

### 3. Group after generating final copy text

Generate the complete text, including the change name where applicable, for every effective tool candidate. Group with the final text as the key and collect tool names in stable detector order. A group is the UI choice and contains `text` plus `tools[]`; duplicate tool names within a group are removed.

If one group remains, the chip copies directly regardless of how many tools contributed. If multiple groups remain, the menu renders one row per group, displaying the joined tool names and command text. This directly represents the user's real decision: which distinct command to run.

Alternative considered: group by invocation-form id. Rejected because final text is the actual copied contract and avoids accidental duplicate entries after workflow-specific interpolation.

### 4. Treat shared `.agents/skills` as the only multi-form evidence exception

A matching `.agents/skills/openspec-*/SKILL.md` file contributes two candidate interpretations: Shared `.agents` with `skill-slash` and Codex with `skill-dollar`. The filesystem cannot distinguish the init target, so selecting one automatically would invent evidence. Both candidates still group normally with any identical command strings from other detected tools.

Alternative considered: prefer slash or dollar form. Rejected because either preference can generate an unusable command for a legitimately configured target.

### 5. Remove synthetic and custom fallback candidates

The shortcut path no longer consumes `toolOptions`, fallback form catalogs, undetected-tool choices, or custom text. If candidate resolution returns zero groups, `CommandShortcutBar` omits that workflow's chip. If all workflows on a surface resolve to zero groups, no command shortcut controls render there.

The static supported-tool catalog may remain for documentation or compatibility during migration, but it is not an input to copy candidate generation. Settings > Tools remains the recovery path and shows a warning placeholder plus the existing copyable `openspec init <path>` guidance when detection is empty.

Alternative considered: disabled chips or a shortcut-level link to Settings. Rejected in favor of the requested per-button hiding behavior and the existing centralized Tools guidance.

### 6. Keep API migration additive first

Add workflow-specific inventories to the availability response and migrate the frontend to them before removing deprecated aggregate fields such as singular integration `form`, deduplicated `forms`, or `toolOptions`. Server and frontend tests must demonstrate that candidate generation ignores static options once inventory data is available. A later cleanup may remove deprecated fields after compatibility risk is assessed.

Alternative considered: replace the response shape immediately. Rejected because an additive migration is easier to validate and roll back.

## Risks / Trade-offs

- **[Artifact filename parsing differs across tool layouts]** → Keep parsing table-driven by command shape, normalize extensions and paths, and add fixtures for folder, filename, prompt, workflow, and shared skill roots.
- **[Partial updates hide shortcuts users previously saw]** → This is intentional; Settings shows detected evidence and the zero-detection warning directs users to `openspec init`, while per-workflow absence can be corrected with `openspec update`.
- **[Long grouped tool labels]** → Preserve stable order, use the existing truncation affordance for visible rows, and keep the full names available to accessible/title text.
- **[Legacy API fields disagree with inventories]** → Define inventories as authoritative for candidate resolution and test that deprecated fields cannot reintroduce synthetic candidates.
- **[Shared `.agents` still requires a choice]** → Limit the exception to matching `.agents` artifacts and clearly label both documented target interpretations.

## Migration Plan

1. Add workflow-specific artifact inventories and tests to server detection and the availability API without removing legacy fields.
2. Replace frontend tool-option expansion with inventory-based per-workflow resolution and command-text grouping.
3. Update `CommandShortcutBar` to direct-copy one group, select among multiple groups, and omit zero-candidate workflows.
4. Add the Settings > Tools zero-detection warning placeholder and localization.
5. Remove `Other tool…`, custom command UI, and unused frontend fallback builders; retain or deprecate server catalog fields only as compatibility requires.
6. Validate server, frontend, integration, localization, and strict OpenSpec checks. Rollback can restore the previous frontend resolver while additive API fields remain harmless.


---

## Revisions

| 日期 | 类型 | 变更描述 | 原因 | 影响 API |
|------|------|----------|------|----------|
| 2026-08-11 | behavior | 複数候補メニューのプレビューではchange名を省略し、コピーされる実際のコマンドにはchange名を保持する | 長いchange名でメニューが横に広がり、ツール名が圧縮されるため | - |
