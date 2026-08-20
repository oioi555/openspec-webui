## Context

See `proposal.md` for motivation. Settings currently renders the locale selector inside General, while the active project's `context` is already parsed and displayed elsewhere but is not presented as an artifact-language setting. The Tools detector scans `.agents/skills` and intentionally emits Shared `.agents` slash and Codex dollar interpretations because both used the same physical path before v1.10.

OpenSpec v1.10 adds `.agents/skills/.openspec-target` with `agents`, `codex`, or `zed` as the shared-tree writer target. It also adds `openspec init --language`, which generates context guidance only for a new project; existing custom context must not be overwritten by the WebUI.

## Goals / Non-Goals

**Goals:**

- Give Language its own Settings navigation destination without changing locale persistence.
- Explain WebUI display language and OpenSpec artifact language together while preserving their independent state.
- Recognize Zed through v1.10 target metadata using the existing Skills detection and slash invocation machinery.
- Keep markerless repositories compatible with the current Shared `.agents` / Codex behavior.

**Non-Goals:**

- Editing `openspec/config.yaml`, executing `openspec init`, or treating the displayed CLI example as an active-project update action.
- Adding an artifact-language preference to WebUI storage or inferring a structured language from arbitrary project context.
- Redesigning the tool-definition catalog or adding general Shared Agent Skills compatibility data; that belongs to `visualize-tool-compatibility`.
- Detecting whether Zed, Codex, or any other executable is installed.

## Decisions

### Make Language a first-class Settings section

Move the existing locale control as-is into a new Language section and add a separate artifact-language guidance block below it. The section follows the existing Settings section navigation and scroll-target pattern, so direct section opening remains consistent with Validation and Tools.

The guidance links to a new shared `multiLanguage` documentation constant, explains manual `context` editing for existing projects, and displays the official invariant about English structural headings and normative keywords. The command block is last and explicitly captioned for new-project initialization.

Alternative considered: leave the selector in General and add guidance to Tools. This separates two language concepts that users need to compare and makes the CLI guidance difficult to discover.

### Derive a convenience CLI example from the WebUI locale without coupling state

Maintain an explicit mapping from each supported locale to a human-readable OpenSpec language string:

| Locale | CLI example value |
|---|---|
| `en` | `English` |
| `ja` | `Japanese` |
| `de` | `German` |
| `es` | `Spanish` |
| `fr` | `French` |
| `pt-BR` | `Portuguese (pt-BR)` |
| `zh-CN` | `Chinese (Simplified)` |

Render `openspec init --language "<mapped value>"` with the shared code-and-copy affordance. The mapping changes only presentation; it is not persisted separately and never reads or writes project context.

Alternative considered: render a literal `<language>` placeholder. A concrete localized example is easier to use and satisfies the request to bring WebUI and CLI language guidance together without pretending they are synchronized.

### Treat `.openspec-target` as additive evidence, not an artifact

When the detector finds one or more valid OpenSpec skills under `.agents/skills`, it reads and trims `.agents/skills/.openspec-target`. Only `agents`, `codex`, and `zed` are accepted. The marker is ignored when there are no matching skills, so a stale marker cannot create an integration by itself.

Expose an additive shared-target field through command availability rather than replacing the workflow-specific inventory. Settings uses it to label the shared tree, and candidate generation uses it to choose interpretations.

| Marker state | Settings identity | Candidate interpretations |
|---|---|---|
| `zed` | Zed Agent | Zed slash |
| `agents` | Shared `.agents` | Shared slash |
| `codex` | Codex-led shared tree | Codex dollar and documented slash compatibility |
| absent, invalid, unreadable | Shared `.agents` / Codex | Legacy slash and dollar ambiguity |

The Codex-led case retains both forms because v1.10 reconciles Codex with other shared-root selections into one tree whose handoffs document both forms. The marker records the selected writer, not the complete list of consumers.

Alternative considered: map every valid marker to exactly one candidate. That would incorrectly remove the documented slash compatibility from a Codex-led tree created for multiple shared-root targets.

### Reuse the existing invocation form and grouping pipeline

Zed uses the existing skill-slash form, so no new invocation-form id is added. The candidate resolver adds the target-specific tool attribution before final-command grouping. Identical slash commands continue to collapse into one choice, and marker processing never introduces tools unrelated to the detected `.agents/skills` evidence.

Alternative considered: add a Zed-specific invocation form. It would duplicate `/openspec-*` behavior and complicate grouping without changing copied text.

## Risks / Trade-offs

- [A marker records the shared-tree writer rather than every selected consumer] → Label the resolved target accurately, retain documented Codex-led compatibility, and leave broader ecosystem compatibility to the separate reference dialog.
- [Old or manually copied trees have no marker] → Preserve the current dual-form ambiguity as the explicit fallback.
- [A human-readable CLI language value may not match the user's desired artifact language] → Describe it as a convenience example, keep the settings independent, and link to the official documentation.
- [Project context can express language in arbitrary prose] → Do not parse or claim a current artifact-language value.

## Migration Plan

1. Add the documentation URL, locale-to-language mapping, localized catalog entries, and independent Settings section.
2. Add target-marker parsing and the additive API field while retaining all existing evidence fields.
3. Update Settings labels and candidate resolution for valid targets, then cover legacy and error fallbacks.
4. Existing preferences and markerless repositories require no migration. Rollback removes the additive target interpretation and returns to the legacy ambiguous behavior.
