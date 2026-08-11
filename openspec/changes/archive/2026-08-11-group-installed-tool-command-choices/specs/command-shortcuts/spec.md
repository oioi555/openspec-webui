## ADDED Requirements

### Requirement: Generate installed-only grouped invocation candidates
The system SHALL internally generate copyable command text from the official OpenSpec invocation forms: `/opsx:<id>`, `/opsx-<id>`, `@opsx-<id>`, `/openspec-<skill>`, `/skill:openspec-<skill>`, and `$openspec-<skill>`. Forms based on a workflow id SHALL interpolate the workflow id; forms based on a skill name SHALL interpolate the workflow's resolved skill name (for example `sync` → `openspec-sync-specs`). The system SHALL append no positional arguments for workspace-scoped commands and SHALL append `<change-name>` for change-scoped commands.

For each workflow, the system SHALL build candidates exclusively from matching OpenSpec artifacts detected in the active repository. For a tool that has matching Commands and Skills artifacts for the same workflow, the system SHALL use the Commands form; when only one matching delivery exists, it SHALL use that delivery. The system SHALL group effective tool candidates by their final generated command text, SHALL show every corresponding tool name on the grouped choice, and SHALL collapse duplicate evidence for the same tool and command text.

As the sole ambiguity exception, a matching skill under the shared `.agents/skills` root SHALL produce both documented candidate interpretations—Shared `.agents` using `/openspec-<skill>` and Codex using `$openspec-<skill>`—because those targets use the same repository artifact tree and cannot be distinguished by filesystem evidence alone. These candidates SHALL otherwise follow the same command-text grouping and selection rules.

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

#### Scenario: Shared agents evidence preserves both documented forms
- **WHEN** `.agents/skills` contains the matching OpenSpec skill artifact for a workflow
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

## REMOVED Requirements

### Requirement: Generate tool-identified invocation candidates

**Reason**: Tool-per-row choices, static supported-tool fallbacks, and custom/undetected choices can generate unusable commands and duplicate identical command strings.

**Migration**: Use `Generate installed-only grouped invocation candidates`, which derives each workflow choice from matching repository artifacts, applies Commands-first priority, and groups tool names by final command text.
