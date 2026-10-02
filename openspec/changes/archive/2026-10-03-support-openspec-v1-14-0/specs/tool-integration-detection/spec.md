## ADDED Requirements

### Requirement: Recognize unique-path OpenSpec v1.14.0 integration artifacts
The system SHALL recognize repository-local OpenSpec artifacts generated for AtomCode, Code Studio, DeepSeek Harness, EasyCode, GigaCode, Grok Build, Veai, and Warp. Command files under `.atomcode/commands` and `.gigacode/commands` named `opsx-<workflow-id>.*` SHALL be reported as Commands evidence using the `/opsx-<workflow-id>` invocation form. Command files under `.codestudio/prompts` named `opsx-<workflow-id>.prompt.md` SHALL be reported as Code Studio Commands evidence using the `/opsx-<workflow-id>` invocation form. Command files under `.easycode/commands/opsx` named `<workflow-id>.*` SHALL be reported as EasyCode Commands evidence using the `/opsx:<workflow-id>` invocation form. Skill files under `.atomcode/skills`, `.codestudio/skills`, `.dsh/skills`, `.easycode/skills`, `.gigacode/skills`, `.grok/skills`, `.veai/skills`, and `.warp/skills` in `openspec-*/SKILL.md` directories SHALL be reported as Skills evidence using the `/openspec-*` invocation form. Detection SHALL retain both evidence sets when both deliveries exist, SHALL expose them through command availability, and SHALL NOT report a tool from empty directories, a bare `WARP.md` file, or any other non-OpenSpec marker file.

#### Scenario: Detect AtomCode command evidence
- **WHEN** the active repository contains `.atomcode/commands/opsx-propose.md`
- **THEN** detection reports AtomCode Commands evidence for the `propose` workflow
- **AND** reports `/opsx-propose` as the example invocation

#### Scenario: Detect Code Studio prompt command evidence
- **WHEN** the active repository contains `.codestudio/prompts/opsx-propose.prompt.md`
- **THEN** detection reports Code Studio Commands evidence for the `propose` workflow
- **AND** reports `/opsx-propose` as the example invocation
- **AND** reports `.codestudio/prompts/opsx-propose.prompt.md` as the source path

#### Scenario: Detect EasyCode TOML command evidence
- **WHEN** the active repository contains `.easycode/commands/opsx/propose.toml`
- **THEN** detection reports EasyCode Commands evidence for the `propose` workflow
- **AND** reports `/opsx:propose` as the example invocation

#### Scenario: Detect GigaCode command evidence
- **WHEN** the active repository contains `.gigacode/commands/opsx-propose.md`
- **THEN** detection reports GigaCode Commands evidence for the `propose` workflow
- **AND** reports `/opsx-propose` as the example invocation

#### Scenario: Detect DeepSeek Harness skill evidence
- **WHEN** the active repository contains `.dsh/skills/openspec-apply-change/SKILL.md`
- **THEN** detection reports DeepSeek Harness Skills evidence for the `openspec-apply-change` skill
- **AND** reports `/openspec-propose` as the representative skill invocation

#### Scenario: Detect Grok Build skill evidence
- **WHEN** the active repository contains `.grok/skills/openspec-apply-change/SKILL.md`
- **THEN** detection reports Grok Build Skills evidence for the `openspec-apply-change` skill
- **AND** reports `/openspec-propose` as the representative skill invocation

#### Scenario: Detect Veai skill evidence
- **WHEN** the active repository contains `.veai/skills/openspec-apply-change/SKILL.md`
- **THEN** detection reports Veai Skills evidence for the `openspec-apply-change` skill
- **AND** reports `/openspec-propose` as the representative skill invocation

#### Scenario: Detect Warp skill evidence
- **WHEN** the active repository contains `.warp/skills/openspec-apply-change/SKILL.md`
- **THEN** detection reports Warp Skills evidence for the `openspec-apply-change` skill
- **AND** reports `/openspec-propose` as the representative skill invocation

#### Scenario: Ignore an empty unique-path integration directory
- **WHEN** `.atomcode/commands`, `.warp/skills`, or another unique v1.14.0 integration directory exists without matching OpenSpec artifacts
- **THEN** detection does not report that tool as integration evidence

#### Scenario: Ignore a bare Warp marker file
- **WHEN** the repository contains `WARP.md` and no matching OpenSpec skill under `.warp/skills`
- **THEN** detection does not report Warp integration evidence

#### Scenario: Preserve both unique-path deliveries
- **WHEN** matching AtomCode command and skill artifacts are both present
- **THEN** detection retains both workflow-specific evidence sets for AtomCode
- **AND** reports the integration delivery as `both`

#### Scenario: API returns unique-path v1.14.0 evidence
- **WHEN** the command availability API inspects a repository with matching Warp or EasyCode artifacts
- **THEN** its integrations include those tools with the matching Commands and Skills inventories
- **AND** its supported tool options include those tools' preferred invocation forms

### Requirement: Parse compound `.prompt.md` command filenames
The system SHALL treat `.prompt.md` as a single command-file suffix when deriving a workflow id from an OpenSpec command filename. A file named `opsx-<workflow-id>.prompt.md` SHALL be reported as workflow id `<workflow-id>`. Ordinary last-extension stripping SHALL remain valid for `.md`, `.toml`, and other single-suffix command files.

#### Scenario: Detect GitHub Copilot prompt command files
- **WHEN** the active repository contains `.github/prompts/opsx-propose.prompt.md`
- **THEN** detection reports GitHub Copilot Commands evidence for the `propose` workflow
- **AND** does not treat the workflow id as `propose.prompt`

#### Scenario: Detect Kiro prompt command files
- **WHEN** the active repository contains `.kiro/prompts/opsx-propose.prompt.md`
- **THEN** detection reports Kiro Commands evidence for the `propose` workflow

#### Scenario: Preserve single-extension command files
- **WHEN** the active repository contains `.cursor/commands/opsx-propose.md`
- **THEN** detection reports Cursor Commands evidence for the `propose` workflow

### Requirement: Surface IBM Bob under the official catalog name
The system SHALL report IBM Bob repository integration evidence using the official catalog display name `IBM Bob`.

#### Scenario: Detect IBM Bob using the catalog name
- **WHEN** the active repository contains `.bob/commands/opsx-propose.md`
- **THEN** detection reports IBM Bob Commands evidence for the `propose` workflow
- **AND** the detected tool name is `IBM Bob`

## MODIFIED Requirements

### Requirement: Inventory workflow-specific OpenSpec integration artifacts
The system SHALL detect OpenSpec-generated tool-specific Commands and Skills artifacts present in the active repository and SHALL retain enough artifact-level evidence to determine, independently for each workflow, whether each tool has a matching Commands artifact, a matching Skills artifact, or both. Detection SHALL associate command artifacts with workflow ids and skill artifacts with OpenSpec skill names, invocation forms, delivery types, and source paths. Detection SHALL look for real OpenSpec-generated artifacts only, SHALL NOT attempt to detect the AI tool executable itself or global integrations, SHALL NOT treat empty directories as evidence, and SHALL degrade safely when a configured path cannot be read.

The system SHALL continue to report detected integrations in Settings as repository-local configuration rather than claiming that an AI tool executable is installed. Repository-local artifact evidence SHALL nevertheless be authoritative for command-shortcut candidate eligibility: a workflow without a matching detected artifact SHALL not receive a candidate.

When matching artifacts exist under `.agents/skills`, detection SHALL read `.agents/skills/.openspec-target` as authoritative shared-tree target metadata only when its trimmed value is `agents`, `codex`, `zed`, `antigravity`, `amp`, or `gsd`. The `zed` value SHALL identify the tree as Zed-generated evidence, the `agents` value SHALL identify Shared `.agents` evidence, the `codex` value SHALL identify Codex-led evidence, the `antigravity` value SHALL identify Antigravity-owned skill evidence, the `amp` value SHALL identify Amp-owned skill evidence, and the `gsd` value SHALL identify GSD-owned skill evidence. An absent, unreadable, or invalid marker SHALL preserve the legacy ambiguity between Shared `.agents` and Codex invocation forms. Marker inspection SHALL NOT be treated as evidence when no matching OpenSpec skill artifact exists and SHALL NOT assert that any corresponding executable is installed.

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

### Requirement: Expose shared skill target metadata via the API
The command availability API SHALL expose the resolved `.agents/skills` target state as `agents`, `codex`, `zed`, `antigravity`, `amp`, `gsd`, or legacy ambiguous alongside the existing workflow-specific artifact evidence. The metadata SHALL be additive and SHALL preserve existing integration evidence fields.

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
