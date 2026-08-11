## 1. Workflow-Specific Integration Evidence

- [x] 1.1 Extend server and shared API types so each detected tool can expose Commands workflow ids and sources plus Skills names and sources without discarding dual-delivery evidence.
- [x] 1.2 Update table-driven repository scanning to enumerate every matching command file and `openspec-*/SKILL.md`, derive normalized workflow or skill identifiers for every supported directory shape, and retain the shared `.agents` ambiguity.
- [x] 1.3 Update command-availability assembly and serialization so workflow-specific inventories are returned while legacy aggregate fields remain compatibility-only and cannot synthesize shortcut candidates.
- [x] 1.4 Add server unit and integration fixtures covering folder and filename commands, prompts/workflows variants, skills, partial workflow sets, both deliveries, empty/unreadable paths, and shared `.agents` evidence.

## 2. Installed-Only Candidate Resolution

- [x] 2.1 Replace static tool-option expansion with a pure per-workflow resolver that matches workflow ids or canonical skill names against detected artifact inventories.
- [x] 2.2 Implement Commands-first resolution per tool and workflow, falling back to a matching skill only when that workflow's command artifact is absent.
- [x] 2.3 Preserve both Shared `.agents` slash and Codex dollar interpretations only for matching `.agents/skills` evidence.
- [x] 2.4 Generate final copy text and group candidates by that text, collecting stable, deduplicated tool-name lists for each group.
- [x] 2.5 Remove the supported-but-undetected fallback catalog, undetected-tool builders, and custom-command candidate path from shortcut resolution.
- [x] 2.6 Add resolver tests for one and multiple tools, identical and distinct command strings, per-workflow partial artifacts, both-delivery priority, skill fallback, change-name arguments, zero candidates, and `.agents` ambiguity.

## 3. Shortcut and Tools UI

- [x] 3.1 Update `CommandShortcutBar` to omit each zero-candidate workflow, directly copy one grouped command, and show one menu row per distinct command only when multiple groups remain.
- [x] 3.2 Render every associated tool name on grouped menu choices with stable ordering, truncation, and full accessible/title text for long labels.
- [x] 3.3 Remove `Other tool…`, custom command input, and all UI paths to supported-but-undetected tools.
- [x] 3.4 Add a localized warning-style placeholder to Settings > Tools when an active repository has zero detected integrations while preserving the copyable `openspec init <active-repository-path>` guidance.
- [x] 3.5 Update component tests for direct copy with multiple same-command tools, grouped multi-command selection, per-button hiding, complete zero-detection hiding, absence of fallback/custom controls, and the Tools warning state.
- [x] 3.6 Omit the change name from multi-candidate menu previews while preserving it in the copied command, and cover the distinction with a component test.
- [x] 3.7 Add the zero-integration warning message to every supported locale and verify locale-key completeness.

## 4. Verification and Cleanup

- [x] 4.1 Remove frontend code and types made unreachable by installed-only candidate resolution, documenting retained server compatibility fields as deprecated where applicable.
- [x] 4.2 Run server and frontend unit/integration tests, TypeScript checks, localization validation, and production build; fix regressions without restoring synthetic candidates.
- [x] 4.3 Run strict OpenSpec validation for `group-installed-tool-command-choices` and confirm every delta scenario is represented by automated coverage or an explicit manual verification step.
