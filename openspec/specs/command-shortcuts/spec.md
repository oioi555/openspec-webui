# command-shortcuts Specification

## Purpose
Generates and surfaces copyable OpenSpec commands in the web UI using tool-identified invocation candidates detected for the active repository, with visibility rules that adapt to workspace state and change completion status.

## Requirements

### Requirement: Show workspace-only command buttons on Dashboard and Changes
The system SHALL render copy-command buttons inline within the ACTIVE CHANGES section header surface using the `CommandChip` component from `$lib/components/shared/command-chip/`, whether that surface is shown in the persistent Explorer Pane or the temporary narrow-width Home drawer. The system SHALL include `propose` and `explore` only when those commands are present in the CLI-reported `workflows` list for the active project and are enabled via visibility settings, SHALL include `new` only when that command is present in the CLI-reported `workflows` list, is available, and is enabled, SHALL include `bulk-archive` only when at least one active change is fully complete and that command is present in the CLI-reported `workflows` list, is available, and is enabled, SHALL NOT include `continue`, `ff`, `apply`, `update`, `verify`, `sync`, or `archive` in the workspace command row, and SHALL NOT include `onboard` in the workspace command row. The row SHALL remain compact, SHALL wrap when many commands are visible, and SHALL preserve command-emphasis styling distinct from standard action buttons.

#### Scenario: Show enabled workspace commands on Home
- **WHEN** the operator views the Home surface and the CLI-reported `workflows` list includes `propose` and `explore`
- **THEN** the UI shows `CommandChip` controls for `propose` and `explore` if those commands are enabled via visibility settings

#### Scenario: Hide update from the workspace command row
- **WHEN** the workspace command row is rendered and the CLI-reported `workflows` list includes `update`
- **THEN** no `CommandChip` or generated command text for `update` is shown in the workspace command row

#### Scenario: Hide continue and ff from the workspace command row
- **WHEN** the workspace command row is rendered and at least one active change still has incomplete tasks and the CLI-reported `workflows` list includes `continue` and `ff`
- **THEN** no `CommandChip` or generated command text for `continue` or `ff` is shown in the workspace command row
- **AND** `continue` and `ff` remain available only on change-scoped command surfaces

#### Scenario: Show bulk archive when completed active changes exist
- **WHEN** at least one active change is fully complete and the CLI-reported `workflows` list includes `bulk-archive`
- **THEN** the UI shows a `CommandChip` for `bulk-archive` only if that command is available and enabled

#### Scenario: Wrap a dense workspace command row
- **WHEN** multiple workspace commands are simultaneously visible
- **THEN** the command row wraps across lines with compact spacing
- **AND** the chips remain visually grouped apart from surrounding title / count UI

#### Scenario: Copy a workspace command without arguments
- **WHEN** the operator activates a workspace command button with a single detected invocation form
- **THEN** the system copies only the command text
- **AND** does not append a change name

#### Scenario: Show workspace commands in narrow-width home drawer
- **WHEN** the viewport width is less than 768px and the operator opens the Home drawer
- **THEN** the ACTIVE CHANGES section header in that drawer shows the same `CommandChip` controls as the persistent Explorer Pane

#### Scenario: Hide onboard from the workspace command row
- **WHEN** the workspace command row is rendered
- **THEN** no `CommandChip` or generated command text for `onboard` is shown

### Requirement: Show change-scoped command buttons in ChangeViewer
The system SHALL render change-scoped copy-command buttons inline within the ChangeViewer header using `CommandChip` components. The system SHALL also render change-scoped copy-command buttons within each Dashboard Active Changes list item using `CommandChip` components via `CommandShortcutBar`. The system SHALL show `apply` only when the change still has incomplete tasks, `apply` is present in the CLI-reported `workflows` list for the active project, and the command is enabled; SHALL show `continue` and `ff` for incomplete changes only when those commands are present in the CLI-reported `workflows` list, are available, and are enabled; SHALL show `update` (labeled `Update`) for any active, unarchived change when `update` is present in the CLI-reported `workflows` list and the command is enabled, regardless of task completion status; and SHALL show `sync` for any active, unarchived change that has one or more spec deltas and the command is enabled, regardless of task completion status. The system SHALL show `verify` only when the change has no incomplete tasks and the command is enabled, and SHALL show `archive` only when the change has no incomplete tasks and the command is enabled. Change-scoped command chips SHALL be ordered left-to-right by workflow stage so later-stage actions appear farther right; incomplete changes SHALL order implementation-continuation commands before `sync` with `update` immediately after `apply`, and completed changes SHALL order commands as `verify`, `update`, `sync`, `archive`. In Dashboard list items, the command chips SHALL be visually separated from the primary open-change action and SHALL be preceded by a `Next Step` cue label. The entire `Next Step` command row, including its background and label, SHALL be a non-navigating command region. The primary change summary above that row SHALL remain the explicit open-change action.

#### Scenario: Show commands for an incomplete active change in Dashboard
- **WHEN** the Dashboard surface renders an active change with incomplete tasks and the CLI-reported `workflows` list includes `apply`, `update`, `continue`, and `ff`
- **THEN** that change item shows a `CommandChip` for `apply` only if enabled
- **AND** shows `update`, `continue`, and `ff` only if those commands are enabled

#### Scenario: Show update for a complete active change in Dashboard
- **WHEN** the Dashboard surface renders an active change whose tasks are all complete and the CLI-reported `workflows` list includes `update`
- **THEN** that change item shows a `CommandChip` for `update` only if enabled
- **AND** the `update` chip is labeled `Update`, matching the workflow command name `/opsx:update` (skill `openspec-update-change`)

#### Scenario: Show sync for an incomplete active change with spec deltas in Dashboard
- **WHEN** the Dashboard surface renders an active change with incomplete tasks and one or more spec deltas
- **THEN** that change item shows a `CommandChip` for `sync` only if enabled
- **AND** the `sync` command appears to the right of implementation-continuation commands in the command row

#### Scenario: Hide sync for an incomplete active change without spec deltas in Dashboard
- **WHEN** the Dashboard surface renders an active change with incomplete tasks and no spec deltas
- **THEN** that change item does not show a `CommandChip` for `sync`

#### Scenario: Show commands for a complete active change in Dashboard
- **WHEN** the Dashboard surface renders an active change whose tasks are all complete and that has one or more spec deltas
- **THEN** that change item shows `CommandChip` controls ordered as `verify`, `update`, `sync`, `archive` for the enabled commands

#### Scenario: Dashboard command row shows next-step cue
- **WHEN** the Dashboard renders change-scoped command chips for an active change
- **THEN** the command row shows a `Next Step` label before the command chips
- **AND** the cue remains visible even if only one command chip is shown

#### Scenario: Dashboard command chips do not open the change
- **WHEN** the operator activates a change-scoped command chip in a Dashboard Active Changes item
- **THEN** the system copies the command text for that change
- **AND** the current tab remains on Dashboard

#### Scenario: Dashboard next-step row background opens the change
- **WHEN** the operator clicks the `Next Step` row background or label area in a Dashboard Active Changes item
- **THEN** the current tab remains on Dashboard
- **AND** the command chips within that row remain directly interactive

#### Scenario: Dashboard primary change summary remains clickable
- **WHEN** the operator clicks the primary summary portion of a Dashboard Active Changes item, including its metadata/progress line
- **THEN** the corresponding change opens or focuses in the Main Viewer
- **AND** the `Next Step` row remains a separate non-navigating command region

#### Scenario: Show commands for an incomplete active change in ChangeViewer
- **WHEN** the operator opens an active change with incomplete tasks and the CLI-reported `workflows` list includes `apply` and `update`
- **THEN** the UI shows a `CommandChip` for `apply` inline in the header only if enabled
- **AND** shows `update` only if enabled

#### Scenario: Show update for a complete active change in ChangeViewer
- **WHEN** the operator opens an active change whose tasks are all complete and the CLI-reported `workflows` list includes `update`
- **THEN** the UI shows a `CommandChip` for `update` inline in the header only if enabled
- **AND** the `update` chip is labeled `Update`, matching the workflow command name `/opsx:update` (skill `openspec-update-change`)

#### Scenario: Show sync for an incomplete active change with spec deltas in ChangeViewer
- **WHEN** the operator opens an active change with incomplete tasks and one or more spec deltas
- **THEN** the UI shows a `CommandChip` for `sync` inline in the header only if enabled
- **AND** the `sync` command appears to the right of implementation-continuation commands in the command row

#### Scenario: Hide sync for an active change without spec deltas in ChangeViewer
- **WHEN** the operator opens an active change with no spec deltas
- **THEN** the UI does not show a `CommandChip` for `sync`

#### Scenario: Show commands for a complete active change in ChangeViewer
- **WHEN** the operator opens an active change whose tasks are all complete and that has one or more spec deltas
- **THEN** the UI shows enabled command chips ordered as `verify`, `update`, `sync`, `archive` inline in the header

#### Scenario: ChangeViewer header does not render suggestion actions
- **WHEN** the ChangeViewer header is rendered after suggestion feature removal
- **THEN** the header shows the command shortcut cluster without any Suggest / Exit button beside it

#### Scenario: Copy a change-scoped command with the change name only
- **WHEN** the operator activates a change-scoped command button with a single detected invocation form
- **THEN** the system copies the command plus the current change name
- **AND** does not append a task label

### Requirement: Exclude onboard from all command surfaces
The system SHALL NOT render, generate, or report the `onboard` command in any command chip, generated command text, command availability response, or command preference surface, even when the underlying CLI reports `onboard` as available.

#### Scenario: Onboard absent from generated commands and chips
- **WHEN** the operator invokes any command generation or command chip surface and the underlying CLI reports `onboard` as available
- **THEN** no generated command text or `CommandChip` references the `onboard` command

#### Scenario: Availability response filters onboard
- **WHEN** the server resolves the command availability for the active project
- **THEN** the availability response does not include the `onboard` command

### Requirement: Generate installed-only grouped invocation candidates
The system SHALL internally generate copyable command text from the official OpenSpec invocation forms: `/opsx:<id>`, `/opsx-<id>`, `@opsx-<id>`, `/openspec-<skill>`, `/skill:openspec-<skill>`, and `$openspec-<skill>`. Forms based on a workflow id SHALL interpolate the workflow id; forms based on a skill name SHALL interpolate the workflow's resolved skill name (for example `sync` → `openspec-sync-specs`). The system SHALL append no positional arguments for workspace-scoped commands and SHALL append `<change-name>` for change-scoped commands.

For each workflow, the system SHALL build candidates exclusively from matching OpenSpec artifacts detected in the active repository. For a tool that has matching Commands and Skills artifacts for the same workflow, the system SHALL use the Commands form; when only one matching delivery exists, it SHALL use that delivery. The system SHALL group effective tool candidates by their final generated command text, SHALL show every corresponding tool name on the grouped choice, and SHALL collapse duplicate evidence for the same tool and command text.

For a matching skill under `.agents/skills`, the system SHALL use valid `.openspec-target` metadata to resolve the shared tree before applying any fallback. A `zed` target SHALL produce the Zed `/openspec-<skill>` candidate, an `agents` target SHALL produce the Shared `.agents` `/openspec-<skill>` candidate, an `antigravity` target SHALL produce the Antigravity `/openspec-<skill>` candidate, and a `codex` target SHALL produce the Codex `$openspec-<skill>` candidate together with the slash-compatible interpretation documented by the Codex-led shared tree. When the target metadata is absent, unreadable, or invalid, the system SHALL preserve the legacy ambiguity by producing both Shared `.agents` slash and Codex dollar candidates. No shared target interpretation SHALL add unrelated supported-but-undetected tools.

When exactly one distinct command string remains, activating the copy control SHALL copy it directly even when multiple detected tools share it. When two or more distinct command strings remain, activating the control SHALL open a menu with one entry per command string and SHALL copy only after the operator selects an entry. When no matching installed artifact is detected for a workflow, the system SHALL hide that workflow's command shortcut on that surface. The selector SHALL NOT offer supported-but-undetected tools, an `Other tool…` entry, or custom command input. The system SHALL NOT auto-copy a previously selected candidate and SHALL NOT persist a tool or form selection globally, per repository, or per command.

#### Scenario: One tool with one matching delivery copies directly
- **WHEN** one tool has a matching Commands or Skills artifact for a workflow
- **THEN** activating the workflow command shortcut copies the generated command immediately

#### Scenario: Commands win when both deliveries match
- **WHEN** one tool has both a matching Commands artifact and a matching Skills artifact for the same workflow
- **THEN** the candidate uses the tool's Commands invocation form
- **AND** no separate Skills choice is shown for that tool and workflow

#### Scenario: Available skill is used when the command artifact is missing
- **WHEN** a tool has a matching Skills artifact for a workflow but has no matching Commands artifact for that workflow
- **THEN** the candidate uses the tool's Skills invocation form even if other command artifacts exist for that tool

#### Scenario: Tools sharing command text form one choice
- **WHEN** two or more detected tools generate the identical final command text for a workflow
- **THEN** the system presents one candidate containing all corresponding tool names
- **AND** activating the shortcut copies directly if no other distinct command text exists

#### Scenario: Distinct command strings require selection
- **WHEN** detected integrations produce two or more distinct command strings for a workflow
- **THEN** the system opens a menu containing one entry for each distinct command string
- **AND** each entry shows all detected tool names that use that command string
- **AND** the command is copied only after the operator selects an entry

#### Scenario: Change-scoped menu previews omit the change name
- **WHEN** a change-scoped workflow has multiple distinct command strings and the candidate menu is open
- **THEN** each menu preview omits the appended change name to preserve space for tool names
- **AND** selecting an entry copies the complete command including the change name

#### Scenario: Zed marker selects the slash form
- **WHEN** `.agents/skills` contains a matching OpenSpec skill and its valid target is `zed`
- **THEN** the candidates include `/openspec-<skill>` attributed to Zed
- **AND** do not include the Codex dollar form solely because the physical path is shared

#### Scenario: Agents marker selects the shared slash form
- **WHEN** `.agents/skills` contains a matching OpenSpec skill and its valid target is `agents`
- **THEN** the candidates include `/openspec-<skill>` attributed to Shared `.agents`
- **AND** do not include the Codex dollar form solely because the physical path is shared

#### Scenario: Antigravity marker selects the Antigravity slash form
- **WHEN** `.agents/skills` contains a matching OpenSpec skill and its valid target is `antigravity`
- **THEN** the candidates include `/openspec-<skill>` attributed to Antigravity
- **AND** do not include the Codex dollar form solely because the physical path is shared

#### Scenario: Codex marker preserves its compatible forms
- **WHEN** `.agents/skills` contains a matching OpenSpec skill and its valid target is `codex`
- **THEN** the candidates include the Codex `$openspec-<skill>` form
- **AND** include the slash-compatible interpretation supported by the Codex-led tree

#### Scenario: Shared agents evidence preserves both documented forms
- **WHEN** `.agents/skills` contains the matching OpenSpec skill artifact and has no valid readable target marker
- **THEN** the candidates include the Shared `.agents` slash form and the Codex dollar form
- **AND** no other supported-but-undetected tool is added

#### Scenario: Missing workflow artifact hides only that shortcut
- **WHEN** integrations are detected for the active repository but none contains a matching artifact for a particular workflow
- **THEN** that workflow's command shortcut is not rendered
- **AND** shortcuts for workflows with matching artifacts remain available

#### Scenario: No detected integrations hides all shortcuts
- **WHEN** no OpenSpec integration artifacts are detected in the active repository
- **THEN** no command shortcuts are rendered

#### Scenario: Undetected and custom choices are absent
- **WHEN** the candidate menu is open
- **THEN** it contains only grouped commands backed by matching detected artifacts
- **AND** it does not contain supported-but-undetected tools, an `Other tool…` entry, or custom command input

#### Scenario: Skill-based forms interpolate the skill name
- **WHEN** a matching skill artifact is selected for the `sync` workflow
- **THEN** the generated command uses the resolved `openspec-sync-specs` skill name with that tool's detected skill invocation form

#### Scenario: Change-scoped candidates append the change name
- **WHEN** the operator selects or directly copies a candidate for a change-scoped command
- **THEN** the copied text appends the current change name

#### Scenario: No last-candidate auto-copy
- **WHEN** the operator previously selected a grouped candidate and later activates a shortcut that still has multiple distinct command strings
- **THEN** the system opens the candidate menu again and does not copy the previously selected candidate without confirmation

### Requirement: Generate SourceCraft skill prompt candidates
The system SHALL represent SourceCraft's documented natural-language skill activation as a stable invocation form and SHALL generate a copyable `use the openspec-<skill> skill` prompt only from matching SourceCraft Skills evidence. The form SHALL interpolate the workflow's canonical OpenSpec skill name. Workspace-scoped prompts SHALL contain no positional argument, while change-scoped prompts SHALL append ` for <change-name>`. Matching SourceCraft Commands evidence SHALL retain the existing Commands-first priority and use `/opsx-<workflow-id>` instead of offering a second SourceCraft Skills choice for the same workflow.

#### Scenario: Generate a SourceCraft workspace skill prompt
- **WHEN** SourceCraft Skills evidence contains `openspec-propose` and no SourceCraft command exists for `propose`
- **THEN** the `propose` shortcut candidate is `use the openspec-propose skill`
- **AND** the candidate is attributed to SourceCraft

#### Scenario: Generate a SourceCraft change-scoped skill prompt
- **WHEN** SourceCraft Skills evidence contains `openspec-apply-change`, no SourceCraft command exists for `apply`, and the active change is `add-login`
- **THEN** the `apply` shortcut candidate is `use the openspec-apply-change skill for add-login`

#### Scenario: SourceCraft command evidence wins over skill evidence
- **WHEN** SourceCraft has matching Commands and Skills evidence for the same workflow
- **THEN** the candidate uses `/opsx-<workflow-id>`
- **AND** no natural-language SourceCraft Skills candidate is added for that workflow

#### Scenario: Group an identical SourceCraft prompt candidate
- **WHEN** multiple detected evidence entries produce the same final SourceCraft prompt text
- **THEN** the system exposes one grouped copy choice
- **AND** preserves the associated tool labels without duplication

#### Scenario: Do not synthesize SourceCraft prompts
- **WHEN** no matching SourceCraft command or skill artifact exists for a workflow
- **THEN** SourceCraft contributes no candidate for that workflow

### Requirement: Centralize workflow metadata
The system SHALL maintain a single source of workflow metadata covering every workflow surfaced in command generation and Tools documentation, providing at minimum for each workflow its id, a user-facing label, a scope of `workspace` or `change`, and the OpenSpec skill name used by skill-based invocation forms (for example `apply` → `openspec-apply-change`, `sync` → `openspec-sync-specs`). The metadata SHALL include `update` with scope `change` and skill name `openspec-update-change`, SHALL NOT include `onboard`, SHALL NOT introduce a per-tool catalog, a generic adapter registry, an arguments schema, or a `multi-change` scope, and SHALL be the single source used to render workflow labels and skill-based invocation text.

#### Scenario: Workflow metadata is complete
- **WHEN** the system resolves metadata for each workflow surfaced in the UI
- **THEN** each workflow has an id, a user-facing label, a `workspace` or `change` scope, and a skill name

#### Scenario: Update is change-scoped with a skill name
- **WHEN** the system resolves metadata for the `update` workflow
- **THEN** the scope is `change`
- **AND** the skill name is `openspec-update-change`

#### Scenario: Workspace and change scope sets are fixed
- **WHEN** the system resolves workflow metadata for every surfaced workflow
- **THEN** `propose`, `explore`, `new`, and `bulk-archive` have scope `workspace`
- **AND** `apply`, `continue`, `ff`, `update`, `verify`, `sync`, and `archive` have scope `change`

#### Scenario: Onboard is absent from workflow metadata
- **WHEN** the system resolves workflow metadata
- **THEN** no `onboard` entry is present

#### Scenario: No multi-change scope exists
- **WHEN** the system resolves workflow metadata for `bulk-archive`
- **THEN** the scope is `workspace` rather than a `multi-change` scope

### Requirement: Resolve command availability from CLI workflows
The system SHALL treat the `workflows` list reported by the OpenSpec CLI/config for the active project as the single source of truth for command availability. A command SHALL be shown only when its workflow id is present in the reported `workflows` list and its visibility preference is enabled, and the system SHALL NOT use a core/expanded dichotomy to decide display. The command availability API SHALL add `delivery`, detected integrations, and invocation-form candidates for the active project, and SHALL retain the existing fields, marking `availableExpandedCommands` as deprecated. The system SHALL continue to exclude `onboard` from every command surface even when the underlying CLI reports `onboard` as available.

#### Scenario: Availability gates commands by the CLI workflows list
- **WHEN** the CLI reports `workflows` such as `["propose","explore","apply","sync","archive","verify"]` for the active project
- **THEN** command surfaces gate every workflow on membership in that list
- **AND** `update` and other absent workflow ids do not appear in any command surface

#### Scenario: Availability response carries delivery and detected forms
- **WHEN** the server resolves command availability for the active project
- **THEN** the response includes `delivery`, the detected integrations, and the detected invocation-form candidates
- **AND** the existing `availableExpandedCommands` field remains present but is marked as deprecated

#### Scenario: Onboard absent from generated commands and chips
- **WHEN** the operator invokes any command generation or command chip surface and the underlying CLI reports `onboard` as available
- **THEN** no generated command text or `CommandChip` references the `onboard` command

#### Scenario: Availability response filters onboard
- **WHEN** the server resolves the command availability for the active project
- **THEN** the availability response does not include the `onboard` command
