## MODIFIED Requirements

### Requirement: Inventory workflow-specific OpenSpec integration artifacts
The system SHALL detect OpenSpec-generated tool-specific Commands and Skills artifacts present in the active repository and SHALL retain enough artifact-level evidence to determine, independently for each workflow, whether each tool has a matching Commands artifact, a matching Skills artifact, or both. Detection SHALL associate command artifacts with workflow ids and skill artifacts with OpenSpec skill names, invocation forms, delivery types, and source paths. Detection SHALL look for real OpenSpec-generated artifacts only, SHALL NOT attempt to detect the AI tool executable itself, SHALL NOT treat empty directories as evidence, and SHALL degrade safely when a configured path cannot be read. An `openspec-*` skill entry that is a symbolic link or junction resolving to a directory containing `SKILL.md` SHALL count as skill evidence; a broken link SHALL NOT. Machine-wide (global) skill evidence is defined by the separate global-skill requirement.

The system SHALL continue to report detected integrations in Settings as repository-local configuration rather than claiming that an AI tool executable is installed. Repository-local artifact evidence SHALL nevertheless be authoritative for command-shortcut candidate eligibility: a workflow without a matching detected artifact SHALL not receive a candidate.

When matching artifacts exist under `.agents/skills`, detection SHALL read `.agents/skills/.openspec-target` as authoritative shared-tree target metadata. The marker MAY contain one entry per line in the OpenSpec 2.x form `<tool>` or `<tool> own-files`; detection SHALL trim each line, SHALL ignore blank lines, SHALL take the first whitespace-separated token as the tool id, and SHALL ignore unknown ids. The single-value forms `agents`, `codex`, `zed`, `antigravity`, `amp`, and `gsd` SHALL keep their existing meaning. The `zed` value SHALL identify the tree as Zed-generated evidence, the `agents` value SHALL identify Shared `.agents` evidence, the `codex` value SHALL identify Codex-led evidence, the `antigravity` value SHALL identify Antigravity-owned skill evidence, the `amp` value SHALL identify Amp-owned skill evidence, and the `gsd` value SHALL identify GSD-owned skill evidence. An absent or unreadable marker, or one with no known tool id, SHALL preserve the legacy ambiguity between Shared `.agents` and Codex invocation forms. Marker inspection SHALL NOT be treated as evidence when no matching OpenSpec skill artifact exists and SHALL NOT assert that any corresponding executable is installed.

Detection SHALL recognize Antigravity command artifacts under the current `.agents/workflows/opsx-<workflow-id>.*` path and SHALL retain read compatibility for OpenSpec artifacts under legacy `.agent/workflows` and `.agent/skills` paths. The presence of the bare shared `.agents` directory or shared skills without an `antigravity` marker SHALL NOT by itself synthesize Antigravity evidence. Shared skills without an `amp` or `gsd` marker SHALL NOT synthesize Amp or GSD evidence.

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

#### Scenario: Recognize an Amp target marker
- **WHEN** matching OpenSpec skills exist under `.agents/skills` and `.openspec-target` contains `amp`
- **THEN** detection identifies Amp repository integration evidence
- **AND** associates the skills with the slash invocation form without synthesizing Codex evidence
- **AND** does not report a separate Shared `.agents` / Codex integration for the same tree

#### Scenario: Recognize a GSD target marker
- **WHEN** matching OpenSpec skills exist under `.agents/skills` and `.openspec-target` contains `gsd`
- **THEN** detection identifies GSD repository integration evidence
- **AND** associates the skills with the slash invocation form without synthesizing Codex evidence
- **AND** does not report a separate Shared `.agents` / Codex integration for the same tree

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

#### Scenario: Markerless shared skills do not claim Amp or GSD
- **WHEN** matching OpenSpec skills exist under `.agents/skills` and no readable valid marker exists
- **THEN** detection does not report Amp integration evidence
- **AND** does not report GSD integration evidence

#### Scenario: Linked skill directories are evidence
- **WHEN** `.claude/skills/openspec-propose` is a symbolic link to `../../.agents/skills/openspec-propose`, which contains `SKILL.md`
- **THEN** detection reports Claude Code Skills evidence for `openspec-propose`
- **AND** reports the source as `.claude/skills/openspec-propose/SKILL.md`

#### Scenario: Broken skill links are not evidence
- **WHEN** an `openspec-*` entry is a symbolic link whose target does not exist
- **THEN** detection reports no evidence for that entry

#### Scenario: Parse a multi-line OpenSpec 2.x marker
- **WHEN** matching skills exist under `.agents/skills` and `.openspec-target` contains the lines `claude own-files`, `codex`, `cursor`, and `kimi`
- **THEN** detection reports the shared tree with targets `codex`, `cursor`, and `kimi`
- **AND** records `claude` as an own-files tool that does not take a shared-tree candidate

### Requirement: Warn when the active repository has no detected integrations
The Settings Tools section SHALL render a warning-style placeholder when an active repository has no detected OpenSpec integration artifacts in either the project scope or the global scope. The placeholder SHALL explain that no repository integrations were found and SHALL direct the operator to the existing `openspec init <active-repository-path>` guidance without claiming the repository is unsupported.

#### Scenario: Tools shows a warning placeholder for zero detection
- **WHEN** an active repository is selected and detection returns no project or global integrations
- **THEN** the Tools integration list area shows a warning-style placeholder
- **AND** the existing copyable `openspec init <active-repository-path>` guidance remains available

#### Scenario: Tools does not show the warning when integrations exist
- **WHEN** one or more OpenSpec integration artifacts are detected for the active repository
- **THEN** the Tools section lists the detected integrations
- **AND** does not show the zero-detection warning placeholder

#### Scenario: Global-only evidence does not trigger the warning
- **WHEN** the repository has no OpenSpec skills but global OpenSpec skills are detected
- **THEN** the Tools section lists the global integrations with a Global badge
- **AND** shows a note that the skills come from the machine-wide install instead of the zero-detection warning

### Requirement: Expose shared skill target metadata via the API
The command availability API SHALL expose the resolved `.agents/skills` target state as `agents`, `codex`, `zed`, `antigravity`, `amp`, `gsd`, `multi`, or legacy ambiguous alongside the existing workflow-specific artifact evidence. It SHALL expose `sharedSkillTargets` (marker tool ids that read `.agents/skills`, own-files excluded) except for 1.x single-value markers. The metadata SHALL be additive and preserve existing evidence fields.

#### Scenario: API returns Zed target metadata
- **WHEN** the active repository contains matching shared skills and a valid `zed` marker
- **THEN** command availability reports `zed` as the resolved shared skill target
- **AND** retains the matching workflow-specific skill evidence

#### Scenario: API returns Antigravity target metadata
- **WHEN** the active repository contains matching shared skills and a valid `antigravity` marker
- **THEN** command availability reports `antigravity` as the resolved shared skill target
- **AND** retains the matching workflow-specific skill evidence

#### Scenario: API returns Amp target metadata
- **WHEN** the active repository contains matching shared skills and a valid `amp` marker
- **THEN** command availability reports `amp` as the resolved shared skill target
- **AND** retains the matching workflow-specific skill evidence

#### Scenario: API returns GSD target metadata
- **WHEN** the active repository contains matching shared skills and a valid `gsd` marker
- **THEN** command availability reports `gsd` as the resolved shared skill target
- **AND** retains the matching workflow-specific skill evidence

#### Scenario: API reports legacy ambiguity
- **WHEN** matching shared skills exist without a valid marker
- **THEN** command availability reports the target as legacy ambiguous
- **AND** retains the existing fallback candidate behavior

#### Scenario: API returns multi-tool target metadata
- **WHEN** the active repository contains matching shared skills and a marker listing `codex`, `cursor`, and `kimi`
- **THEN** command availability reports `multi` as the resolved shared skill target
- **AND** reports `sharedSkillTargets` as `codex`, `cursor`, `kimi`

## ADDED Requirements

### Requirement: Detect global OpenSpec skills
The system SHALL detect machine-wide OpenSpec skills (OpenSpec 2.1+) in the universal folder `<home>/.agents/skills` and in the global skills folders of supported tools that do not read it, listed in a code-owned table with recorded provenance. Global evidence SHALL use the same `openspec-*` + `SKILL.md` rule as project evidence and SHALL carry `scope` `global`; repository-local evidence SHALL carry `scope` `project`. The system SHALL NOT write to the home folder.

#### Scenario: Global-only project yields global evidence
- **WHEN** the repository has no OpenSpec skills and `<home>/.agents/skills/openspec-propose/SKILL.md` exists
- **THEN** detection reports a global shared integration with Skills evidence for `openspec-propose`
- **AND** reports its source as `~/.agents/skills/openspec-propose/SKILL.md`

#### Scenario: Claude config directory override
- **WHEN** `CLAUDE_CONFIG_DIR` is set and `$CLAUDE_CONFIG_DIR/skills/openspec-apply-change/SKILL.md` exists
- **THEN** detection reports a global Claude Code integration with Skills evidence for `openspec-apply-change`

#### Scenario: Project and global evidence coexist
- **WHEN** the repository contains project skills and global skills also exist
- **THEN** detection reports both the project integrations and the global integrations, each with its scope

#### Scenario: Universal folder keeps the ambiguous forms
- **WHEN** global skills are detected only in `<home>/.agents/skills`
- **THEN** the global integration exposes both the slash and the Codex dollar interpretations

#### Scenario: Unreadable global folder degrades safely
- **WHEN** a global skills folder is missing or cannot be read
- **THEN** detection treats it as having no evidence and command availability stays responsive

#### Scenario: Home folder project skips the global pass
- **WHEN** the active project root resolves to the user's home folder
- **THEN** detection does not report `global` integrations for the home skills folders
