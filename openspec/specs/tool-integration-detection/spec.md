# tool-integration-detection Specification

## Purpose
Detects which AI coding tools have OpenSpec integrations (commands and/or skills) configured for the active repository, and surfaces them read-only in Settings to guide users toward the correct invocation format.

## Requirements

### Requirement: Inventory workflow-specific OpenSpec integration artifacts
The system SHALL detect OpenSpec-generated tool-specific Commands and Skills artifacts present in the active repository and SHALL retain enough artifact-level evidence to determine, independently for each workflow, whether each tool has a matching Commands artifact, a matching Skills artifact, or both. Detection SHALL associate command artifacts with workflow ids and skill artifacts with OpenSpec skill names, invocation forms, delivery types, and source paths. Detection SHALL look for real OpenSpec-generated artifacts only, SHALL NOT attempt to detect the AI tool executable itself or global integrations, SHALL NOT treat empty directories as evidence, and SHALL degrade safely when a configured path cannot be read.

The system SHALL continue to report detected integrations in Settings as repository-local configuration rather than claiming that an AI tool executable is installed. Repository-local artifact evidence SHALL nevertheless be authoritative for command-shortcut candidate eligibility: a workflow without a matching detected artifact SHALL not receive a candidate.

When matching artifacts exist under `.agents/skills`, detection SHALL read `.agents/skills/.openspec-target` as authoritative shared-tree target metadata only when its trimmed value is `agents`, `codex`, `zed`, or `antigravity`. The `zed` value SHALL identify the tree as Zed-generated evidence, the `agents` value SHALL identify Shared `.agents` evidence, the `codex` value SHALL identify Codex-led evidence, and the `antigravity` value SHALL identify Antigravity-owned skill evidence. An absent, unreadable, or invalid marker SHALL preserve the legacy ambiguity between Shared `.agents` and Codex invocation forms. Marker inspection SHALL NOT be treated as evidence when no matching OpenSpec skill artifact exists and SHALL NOT assert that any corresponding executable is installed.

Detection SHALL recognize Antigravity command artifacts under the current `.agents/workflows/opsx-<workflow-id>.*` path and SHALL retain read compatibility for OpenSpec artifacts under legacy `.agent/workflows` and `.agent/skills` paths. The presence of the bare shared `.agents` directory or shared skills without an `antigravity` marker SHALL NOT by itself synthesize Antigravity evidence.

#### Scenario: Detect workflow-specific command evidence
- **WHEN** the active repository contains `.opencode/commands/opsx-apply.md` but no `opsx-sync` command file
- **THEN** detection reports OpenCode Commands evidence for the `apply` workflow
- **AND** does not report OpenCode Commands evidence for the `sync` workflow

#### Scenario: Detect workflow-specific skill evidence
- **WHEN** the active repository contains `.opencode/skills/openspec-sync-specs/SKILL.md`
- **THEN** detection reports OpenCode Skills evidence for the `openspec-sync-specs` skill
- **AND** includes the skill invocation form and source path

#### Scenario: Detect both deliveries without discarding evidence
- **WHEN** a tool contains matching Commands and Skills artifacts
- **THEN** detection retains both sets of workflow-specific evidence
- **AND** candidate resolution can apply Commands-first priority independently for each workflow

#### Scenario: Empty directories are not detected
- **WHEN** a tool directory exists but contains no matching OpenSpec command files or `openspec-*` directories containing `SKILL.md`
- **THEN** the system does not report artifact evidence for that directory

#### Scenario: Unreadable detection path degrades safely
- **WHEN** a configured repository-local integration path is missing or cannot be read
- **THEN** detection treats that path as having no evidence
- **AND** command availability remains responsive

#### Scenario: Non-detection is not described as unsupported
- **WHEN** no integration artifact is detected for a tool
- **THEN** Settings does not claim that the tool or repository is unsupported
- **AND** command shortcuts do not offer that tool

#### Scenario: Recognize a Zed target marker
- **WHEN** matching OpenSpec skills exist under `.agents/skills` and `.openspec-target` contains `zed`
- **THEN** detection identifies Zed repository integration evidence
- **AND** associates it with the slash skill invocation form

#### Scenario: Recognize a generic agents target marker
- **WHEN** matching OpenSpec skills exist under `.agents/skills` and `.openspec-target` contains `agents`
- **THEN** detection identifies Shared `.agents` repository integration evidence
- **AND** does not synthesize Codex evidence solely from the shared physical path

#### Scenario: Recognize a Codex target marker
- **WHEN** matching OpenSpec skills exist under `.agents/skills` and `.openspec-target` contains `codex`
- **THEN** detection identifies the tree as Codex-led repository integration evidence
- **AND** preserves the invocation interpretations supported by that generated tree

#### Scenario: Recognize an Antigravity target marker
- **WHEN** matching OpenSpec skills exist under `.agents/skills` and `.openspec-target` contains `antigravity`
- **THEN** detection identifies Antigravity repository integration evidence
- **AND** associates the skills with the slash invocation form without synthesizing Codex evidence

#### Scenario: Detect current Antigravity workflow evidence
- **WHEN** the repository contains `.agents/workflows/opsx-apply.md`
- **THEN** detection reports Antigravity Commands evidence for the `apply` workflow
- **AND** reports `/opsx-apply` as its command invocation

#### Scenario: Preserve legacy Antigravity detection
- **WHEN** the repository contains OpenSpec-managed Antigravity artifacts under `.agent/workflows` or `.agent/skills`
- **THEN** detection reports the corresponding Antigravity evidence
- **AND** treats those paths as legacy read-compatible evidence

#### Scenario: Shared agents root remains ambiguous
- **WHEN** a matching skill artifact is detected under `.agents/skills` and no readable valid marker exists
- **THEN** detection identifies the shared artifact evidence without asserting a single target
- **AND** exposes both legacy documented invocation-form interpretations for candidate resolution

#### Scenario: Marker without skills is not integration evidence
- **WHEN** `.agents/skills/.openspec-target` exists but no matching `openspec-*` skill artifact exists
- **THEN** the system does not report a configured integration from the marker alone

### Requirement: Expose workflow-specific integration evidence via the API
The system SHALL expose repository-local integration evidence through the command availability API for the active project alongside existing availability fields. For each detected tool, the response SHALL make the detected Commands and Skills forms and their workflow-specific artifact identifiers available so the client can resolve candidates without consulting the supported-but-undetected tool catalog. If legacy aggregate integration or form fields are retained for compatibility, candidate selection SHALL NOT use those fields when they lose workflow-level or dual-delivery evidence.

#### Scenario: API returns workflow-specific evidence
- **WHEN** the client requests command availability for an active project with detected integrations
- **THEN** the response identifies the matching command workflow ids and skill names for each detected tool and delivery
- **AND** includes the invocation form needed to generate each candidate

#### Scenario: API preserves dual-delivery evidence
- **WHEN** a detected tool has both Commands and Skills artifacts
- **THEN** the response preserves both evidence sets instead of reducing them to one singular form

#### Scenario: API returns no synthetic candidates
- **WHEN** no matching repository-local artifacts are detected
- **THEN** the response does not synthesize candidates from the static supported-tool catalog

### Requirement: Warn when the active repository has no detected integrations
The Settings Tools section SHALL render a warning-style placeholder when an active repository has no detected OpenSpec integration artifacts. The placeholder SHALL explain that no repository integrations were found and SHALL direct the operator to the existing `openspec init <active-repository-path>` guidance without claiming the repository is unsupported.

#### Scenario: Tools shows a warning placeholder for zero detection
- **WHEN** an active repository is selected and detection returns no integrations
- **THEN** the Tools integration list area shows a warning-style placeholder
- **AND** the existing copyable `openspec init <active-repository-path>` guidance remains available

#### Scenario: Tools does not show the warning when integrations exist
- **WHEN** one or more OpenSpec integration artifacts are detected for the active repository
- **THEN** the Tools section lists the detected integrations
- **AND** does not show the zero-detection warning placeholder

### Requirement: Tools section is read-only with guidance and detected integrations
The Settings sidebar SHALL present the section previously labeled `Workflow` under the short label `Tools`, with a more descriptive in-page heading permitted. The Tools section SHALL be read-only: it SHALL explain how OpenSpec installs per-tool commands and skills, SHALL link to the official supported-tools documentation at `https://github.com/Fission-AI/OpenSpec/blob/main/docs/supported-tools.md` via the shared documentation URL constant, SHALL link to the `openspec init` CLI reference at `https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#openspec-init` via a shared documentation URL constant, rendering both documentation links together in the same docs-link paragraph, SHALL explain that per-repository tool integrations are added or removed by re-running `openspec init`, SHALL list the integrations detected for the active repository (tool name, Commands/Skills delivery, example invocation, detection source), SHALL provide a refresh control that re-runs detection, and SHALL NOT contain any selection or format-fixing setting. The section SHALL describe detected content as "OpenSpec integrations configured for this repository" and SHALL NOT describe detected tools as "installed tools".

The Tools section SHALL also make the scope of the displayed integrations unambiguous by surfacing the active repository path. When an active project is selected, the section SHALL expose a copyable command block containing `openspec init <active-repository-path>` so the operator can re-run init against the current repository from a terminal without retyping the path. The copyable command block SHALL render below the detected-integration list (the integration list is the primary content of the section; the init command is a supplement for changing it), SHALL embed the active repository path in the command (with the full path available via the element title attribute when the visible command is truncated), SHALL reuse the same code-plus-copy-button affordance used by the Versions section's per-tool update command, SHALL use the shared copy-command helper, and SHALL preserve the `openspec init` token in English in every locale. Copying the command SHALL place it on the clipboard only; the section SHALL NOT execute `openspec init` from the browser. When no project is active, the section SHALL render an empty-state message in place of the copyable command block, and SHALL keep the supported-tools documentation link, refresh control, and existing read-only constraints visible.

#### Scenario: Tools section shows explanation and documentation link
- **WHEN** the operator opens the Tools section in Settings
- **THEN** the section explains the integration mechanism
- **AND** links to the official supported-tools documentation using the shared URL constant
- **AND** links to the `openspec init` CLI reference using the shared URL constant
- **AND** both documentation links render together in the same docs-link paragraph

#### Scenario: Tools section shows init guidance
- **WHEN** the operator opens the Tools section in Settings
- **THEN** the section explains that re-running `openspec init` adds or removes per-repository tool integrations

#### Scenario: Tools section lists detected integrations
- **WHEN** the active repository has detected integrations
- **THEN** the section lists each detected integration with tool name, Commands/Skills delivery, example invocation, and detection source

#### Scenario: Tools section refresh re-runs detection
- **WHEN** the operator activates the refresh control in the Tools section
- **THEN** the system re-runs repository detection
- **AND** the detected integrations list updates to reflect the current repository state

#### Scenario: Tools section avoids installed-tools wording
- **WHEN** the Tools section renders its content
- **THEN** the copy refers to "OpenSpec integrations configured for this repository"
- **AND** does not describe detected tools as "installed tools"

#### Scenario: Tools section has no selection settings
- **WHEN** the operator views the Tools section
- **THEN** no command-format selection, global fixing, or per-command format-fixing control is rendered

#### Scenario: Tools section shows the active repository path
- **WHEN** an active project is selected while the operator views the Tools section
- **THEN** the section surfaces the active repository path inside the copyable init command block below the detected-integration list
- **AND** the full path is available via the element title attribute when the visible command is truncated

#### Scenario: Tools section exposes a copyable init command for the active repository
- **WHEN** an active project is selected while the operator views the Tools section
- **THEN** the section renders a command block containing `openspec init <active-repository-path>`
- **AND** the block uses the same code-plus-copy-button affordance as the Versions section update command
- **AND** activating the copy control places the command on the clipboard only and does not execute it

#### Scenario: Tools section keeps init token in English
- **WHEN** the Tools section renders the copyable init command block under a non-English active locale
- **THEN** the `openspec init` token remains in English
- **AND** only the surrounding label and copy-button aria text are localized

#### Scenario: Tools section empty state when no active project
- **WHEN** no project is active while the operator views the Tools section
- **THEN** the section renders an empty-state message in place of the path display and copyable command block
- **AND** the supported-tools documentation link and refresh control remain visible
- **AND** the read-only constraints are preserved

### Requirement: Recognize Command Code integration artifacts
The system SHALL recognize repository-local OpenSpec artifacts generated for Command Code. Command files under `.commandcode/commands` named `opsx-<workflow-id>.*` SHALL be reported as Command Code Commands evidence using the `/opsx-<workflow-id>` invocation form, and skill files under `.commandcode/skills/openspec-*/SKILL.md` SHALL be reported as Command Code Skills evidence using the `/openspec-*` invocation form. The supported-tool catalog SHALL include Command Code without changing the evidence or invocation form reported for any existing tool.

#### Scenario: Detect Command Code command evidence
- **WHEN** the active repository contains `.commandcode/commands/opsx-propose.md`
- **THEN** detection reports Command Code Commands evidence for the `propose` workflow
- **AND** reports `/opsx-propose` as the example invocation

#### Scenario: Detect Command Code skill evidence
- **WHEN** the active repository contains `.commandcode/skills/openspec-apply-change/SKILL.md`
- **THEN** detection reports Command Code Skills evidence for the `openspec-apply-change` skill
- **AND** reports `/openspec-propose` as the representative skill invocation

#### Scenario: Preserve both Command Code deliveries
- **WHEN** matching Command Code command and skill artifacts are both present
- **THEN** detection retains both workflow-specific evidence sets for Command Code
- **AND** existing candidate resolution can apply its Commands-first behavior for each workflow

### Requirement: Expose shared skill target metadata via the API
The command availability API SHALL expose the resolved `.agents/skills` target state as `agents`, `codex`, `zed`, `antigravity`, or legacy ambiguous alongside the existing workflow-specific artifact evidence. The metadata SHALL be additive and SHALL preserve existing integration evidence fields.

#### Scenario: API returns Zed target metadata
- **WHEN** the active repository contains matching shared skills and a valid `zed` marker
- **THEN** command availability reports `zed` as the resolved shared skill target
- **AND** retains the matching workflow-specific skill evidence

#### Scenario: API returns Antigravity target metadata
- **WHEN** the active repository contains matching shared skills and a valid `antigravity` marker
- **THEN** command availability reports `antigravity` as the resolved shared skill target
- **AND** retains the matching workflow-specific skill evidence

#### Scenario: API reports legacy ambiguity
- **WHEN** matching shared skills exist without a valid marker
- **THEN** command availability reports the target as legacy ambiguous
- **AND** retains the existing fallback candidate behavior
