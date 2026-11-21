## MODIFIED Requirements

### Requirement: Inventory workflow-specific OpenSpec integration artifacts
The system SHALL detect OpenSpec-generated Commands and Skills artifacts in the active repository and SHALL retain, per workflow, whether each tool has a matching Commands artifact, Skills artifact, or both, associating commands with workflow ids and skills with skill names, invocation forms, delivery types, and source paths. Detection SHALL use real OpenSpec-generated artifacts only, SHALL NOT detect AI tool executables or count empty directories, and SHALL degrade safely on unreadable paths.

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

#### Scenario: Detection does not probe tool executables
- **WHEN** detection inventories repository integrations
- **THEN** it inspects only OpenSpec-generated artifacts in the repository
- **AND** does not attempt to detect whether any AI tool executable exists
- **AND** machine-wide (global) skill evidence is left to the separate global-skill requirement

#### Scenario: Parse a multi-line OpenSpec 2.x marker
- **WHEN** matching skills exist under `.agents/skills` and `.openspec-target` contains the lines `claude own-files`, `codex`, `cursor`, and `kimi`
- **THEN** detection reports the shared tree with targets `codex`, `cursor`, and `kimi`
- **AND** records `claude` as an own-files tool that does not take a shared-tree candidate

### Requirement: Expose workflow-specific integration evidence via the API
The system SHALL expose repository-local integration evidence through the command availability API for the active project alongside existing fields, giving each detected tool's Commands and Skills forms and workflow-specific artifact identifiers so the client can resolve candidates without the supported-but-undetected tool catalog. Candidate selection SHALL NOT use retained legacy aggregate fields that lose workflow-level or dual-delivery evidence.

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

#### Scenario: Lossy legacy fields are not used for candidates
- **WHEN** the response retains legacy aggregate integration or form fields for compatibility
- **AND** those fields lose workflow-level or dual-delivery evidence
- **THEN** candidate selection does not use those fields

### Requirement: Tools section is read-only with guidance and detected integrations
The Settings sidebar SHALL label the section previously labeled `Workflow` as `Tools`; a more descriptive in-page heading is permitted. The section SHALL be read-only with no selection or format-fixing setting. It SHALL explain how OpenSpec installs per-tool commands and skills and that re-running `openspec init` adds or removes them, SHALL link the supported-tools and `openspec init` CLI docs, SHALL list detected integrations with a refresh control, and SHALL NOT call them installed tools.

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

#### Scenario: Tools section label and documentation URLs
- **WHEN** the operator views the Settings sidebar and the Tools section
- **THEN** the former `Workflow` section is labeled `Tools` in the sidebar, with a more descriptive in-page heading permitted
- **AND** the supported-tools link targets `https://github.com/Fission-AI/OpenSpec/blob/main/docs/supported-tools.md`
- **AND** the init link targets `https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#openspec-init`

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
The system SHALL recognize repository-local OpenSpec artifacts generated for Command Code: `.commandcode/commands/opsx-<workflow-id>.*` files as Commands evidence invoked as `/opsx-<workflow-id>`, and `.commandcode/skills/openspec-*/SKILL.md` files as Skills evidence invoked as `/openspec-*`. The supported-tool catalog SHALL include Command Code without changing the evidence or invocation form reported for any existing tool.

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

#### Scenario: Command Code catalog entry leaves other tools unchanged
- **WHEN** the supported-tool catalog includes Command Code
- **THEN** every existing tool reports the same evidence and invocation form as before

### Requirement: Recognize SourceCraft Code Assistant integration artifacts
The system SHALL recognize repository-local OpenSpec artifacts generated for SourceCraft Code Assistant (VS Code): `.codeassistant/commands/opsx-<workflow-id>.*` files as Commands evidence invoked as `/opsx-<workflow-id>`, and `.codeassistant/skills/openspec-*/SKILL.md` files as Skills evidence invoked as `use the openspec-<skill> skill`. Detection SHALL retain both evidence sets, expose them via command availability, and SHALL NOT report SourceCraft from directories without matching artifacts.

#### Scenario: Detect SourceCraft command evidence
- **WHEN** the active repository contains `.codeassistant/commands/opsx-propose.md`
- **THEN** detection reports SourceCraft Commands evidence for the `propose` workflow
- **AND** reports `/opsx-propose` as the example invocation

#### Scenario: Detect SourceCraft skill evidence
- **WHEN** the active repository contains `.codeassistant/skills/openspec-apply-change/SKILL.md`
- **THEN** detection reports SourceCraft Skills evidence for the `openspec-apply-change` skill
- **AND** reports `use the openspec-apply-change skill` as its invocation example

#### Scenario: Preserve both SourceCraft deliveries
- **WHEN** matching SourceCraft command and skill artifacts are both present
- **THEN** detection retains both workflow-specific evidence sets for SourceCraft
- **AND** reports the integration delivery as `both`

#### Scenario: Ignore an empty SourceCraft integration directory
- **WHEN** `.codeassistant/commands` and `.codeassistant/skills` contain no matching OpenSpec artifacts
- **THEN** detection does not report SourceCraft integration evidence

#### Scenario: API returns SourceCraft evidence
- **WHEN** the command availability API inspects a repository with matching SourceCraft artifacts
- **THEN** its integrations include SourceCraft with the matching Commands and Skills inventories
- **AND** its supported tool options include SourceCraft's preferred command invocation form

### Requirement: Recognize Kilo Code current and legacy command paths
The system SHALL recognize repository-local OpenSpec artifacts generated for Kilo Code. `opsx-<workflow-id>.*` files under the current `.kilo/command` directory, or for read compatibility the legacy `.kilocode/workflows` directory, SHALL be Commands evidence invoked as `/opsx-<workflow-id>`, preferring the current path for each workflow id. `.kilocode/skills/openspec-*/SKILL.md` files SHALL remain Skills evidence invoked as `/openspec-*`. Both evidence sets SHALL be retained.

#### Scenario: Detect current Kilo Code command evidence
- **WHEN** the active repository contains `.kilo/command/opsx-propose.md`
- **THEN** detection reports Kilo Code Commands evidence for the `propose` workflow
- **AND** reports `/opsx-propose` as the example invocation
- **AND** reports `.kilo/command/opsx-propose.md` as the source path

#### Scenario: Preserve legacy Kilo Code command detection
- **WHEN** the active repository contains `.kilocode/workflows/opsx-propose.md` and no matching file under `.kilo/command`
- **THEN** detection reports Kilo Code Commands evidence for the `propose` workflow
- **AND** treats `.kilocode/workflows` as legacy read-compatible evidence

#### Scenario: Prefer current Kilo Code command path on overlap
- **WHEN** the repository contains `.kilo/command/opsx-propose.md` and `.kilocode/workflows/opsx-propose.md`, and only the legacy path contains `opsx-sync.md`
- **THEN** detection reports `propose` from `.kilo/command/opsx-propose.md`
- **AND** reports `sync` from `.kilocode/workflows/opsx-sync.md`

#### Scenario: Detect Kilo Code skill evidence
- **WHEN** the active repository contains `.kilocode/skills/openspec-apply-change/SKILL.md`
- **THEN** detection reports Kilo Code Skills evidence for the `openspec-apply-change` skill
- **AND** reports `/openspec-propose` as the representative skill invocation

#### Scenario: Preserve both Kilo Code deliveries
- **WHEN** matching Kilo Code command and skill artifacts are both present
- **THEN** detection retains both workflow-specific evidence sets for Kilo Code
- **AND** reports the integration delivery as `both`

### Requirement: Recognize unique-path OpenSpec v1.14.0 integration artifacts
The system SHALL recognize repository-local OpenSpec artifacts generated for AtomCode, Code Studio, DeepSeek Harness, EasyCode, GigaCode, Grok Build, Veai, and Warp, reporting their command and skill files as Commands or Skills evidence with each tool's invocation form. Detection SHALL retain both evidence sets, SHALL expose them through command availability, and SHALL NOT report a tool from empty directories, a bare `WARP.md` file, or any other non-OpenSpec marker file.

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

#### Scenario: Unique-path command layouts
- **WHEN** the repository contains OpenSpec command files for these tools
- **THEN** `.atomcode/commands/opsx-<workflow-id>.*` and `.gigacode/commands/opsx-<workflow-id>.*` are Commands evidence invoked as `/opsx-<workflow-id>`
- **AND** `.codestudio/prompts/opsx-<workflow-id>.prompt.md` is Code Studio Commands evidence invoked as `/opsx-<workflow-id>`
- **AND** `.easycode/commands/opsx/<workflow-id>.*` is EasyCode Commands evidence invoked as `/opsx:<workflow-id>`

#### Scenario: Unique-path skill layouts
- **WHEN** `openspec-*/SKILL.md` directories exist under `.atomcode/skills`, `.codestudio/skills`, `.dsh/skills`, `.easycode/skills`, `.gigacode/skills`, `.grok/skills`, `.veai/skills`, or `.warp/skills`
- **THEN** detection reports them as that tool's Skills evidence invoked as `/openspec-*`

## ADDED Requirements

### Requirement: Repository-local artifacts gate command-shortcut candidates
The system SHALL report detected integrations in Settings as repository-local configuration rather than claiming that an AI tool executable is installed. Repository-local artifact evidence SHALL be authoritative for command-shortcut candidate eligibility: a workflow without a matching detected artifact SHALL NOT receive a candidate.

#### Scenario: Integrations are reported as repository configuration
- **WHEN** Settings shows detected integrations
- **THEN** they are described as repository-local configuration
- **AND** Settings does not claim that any AI tool executable is installed

#### Scenario: Workflow without an artifact gets no candidate
- **WHEN** a tool has a matching artifact for the `apply` workflow but none for `sync`
- **THEN** a command-shortcut candidate is offered for `apply`
- **AND** no candidate is offered for `sync`

### Requirement: Interpret the shared `.agents/skills` target marker
When matching artifacts exist under `.agents/skills`, detection SHALL read `.agents/skills/.openspec-target` as authoritative target metadata with one `<tool>` or `<tool> own-files` entry per line. Single-value forms SHALL keep their existing meaning. An absent, unreadable, or unknown-only marker SHALL preserve the legacy ambiguity between Shared `.agents` and Codex invocation forms. The marker SHALL NOT count as evidence without matching skills and SHALL NOT assert an installed executable.

#### Scenario: Marker lines are normalized
- **WHEN** `.openspec-target` contains padded lines, blank lines, and an unknown tool id
- **THEN** detection trims each line and ignores blank lines
- **AND** takes the first whitespace-separated token as the tool id
- **AND** ignores the unknown id

#### Scenario: Single-value markers keep their meaning
- **WHEN** `.openspec-target` contains a single value of `agents`, `codex`, `zed`, `antigravity`, `amp`, or `gsd`
- **THEN** `zed` identifies Zed-generated evidence, `agents` Shared `.agents` evidence, and `codex` Codex-led evidence
- **AND** `antigravity`, `amp`, and `gsd` identify Antigravity-owned, Amp-owned, and GSD-owned skill evidence

#### Scenario: Marker with no known tool id stays ambiguous
- **WHEN** `.openspec-target` contains only unknown tool ids
- **THEN** detection preserves the legacy ambiguity between Shared `.agents` and Codex invocation forms

#### Scenario: Marker does not assert an installed executable
- **WHEN** a valid marker identifies a target tool
- **THEN** detection does not assert that the corresponding executable is installed

### Requirement: Recognize current and legacy Antigravity paths
Detection SHALL recognize Antigravity command artifacts under the current `.agents/workflows/opsx-<workflow-id>.*` path and SHALL retain read compatibility for OpenSpec artifacts under legacy `.agent/workflows` and `.agent/skills` paths. A bare shared `.agents` directory, or shared skills without an `antigravity` marker, SHALL NOT by itself synthesize Antigravity evidence. Shared skills without an `amp` or `gsd` marker SHALL NOT synthesize Amp or GSD evidence.

#### Scenario: Current Antigravity workflow path is evidence
- **WHEN** the repository contains `.agents/workflows/opsx-propose.md`
- **THEN** detection reports Antigravity Commands evidence for the `propose` workflow

#### Scenario: Legacy Antigravity paths stay readable
- **WHEN** the repository contains OpenSpec artifacts under `.agent/workflows` or `.agent/skills`
- **THEN** detection reports them as legacy read-compatible Antigravity evidence

#### Scenario: Shared skills alone do not imply Antigravity, Amp, or GSD
- **WHEN** the repository has a bare `.agents` directory or shared skills whose marker names none of `antigravity`, `amp`, or `gsd`
- **THEN** detection does not synthesize Antigravity, Amp, or GSD evidence

### Requirement: Offer a copyable init command for the active repository
The Tools section SHALL surface the active repository path in a copyable `openspec init <active-repository-path>` block below the detected-integration list, using the Versions section's code-plus-copy-button affordance and the shared copy-command helper, and keeping the `openspec init` token in English in every locale. Copying SHALL only place the command on the clipboard; the browser SHALL NOT run `openspec init`. With no active project, an empty-state message SHALL replace the block.

#### Scenario: Init block follows the integration list
- **WHEN** an active project is selected in the Tools section
- **THEN** the copyable init command block renders below the detected-integration list
- **AND** embeds the active repository path, with the full path in the title attribute when the visible command is truncated

#### Scenario: Copy uses the shared helper without executing
- **WHEN** the operator activates the init block's copy control
- **THEN** the shared copy-command helper places the command on the clipboard
- **AND** the browser does not execute `openspec init`

#### Scenario: No active project shows an empty state
- **WHEN** no project is active
- **THEN** an empty-state message replaces the copyable init command block
- **AND** the supported-tools documentation link, refresh control, and read-only constraints stay visible
