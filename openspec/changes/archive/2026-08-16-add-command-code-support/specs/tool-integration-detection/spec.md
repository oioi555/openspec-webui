## ADDED Requirements

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
