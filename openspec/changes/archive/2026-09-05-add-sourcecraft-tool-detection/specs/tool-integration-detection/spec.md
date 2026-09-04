## ADDED Requirements

### Requirement: Recognize SourceCraft Code Assistant integration artifacts
The system SHALL recognize repository-local OpenSpec artifacts generated for SourceCraft Code Assistant for VS Code. Command files under `.codeassistant/commands` named `opsx-<workflow-id>.*` SHALL be reported as SourceCraft Commands evidence using the `/opsx-<workflow-id>` invocation form. Skill files under `.codeassistant/skills/openspec-*/SKILL.md` SHALL be reported as SourceCraft Skills evidence using the natural-language `use the openspec-<skill> skill` invocation form. Detection SHALL retain both evidence sets when both deliveries exist, SHALL expose them through command availability, and SHALL NOT report SourceCraft from directories that contain no matching artifacts.

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
