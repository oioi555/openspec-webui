## MODIFIED Requirements

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
