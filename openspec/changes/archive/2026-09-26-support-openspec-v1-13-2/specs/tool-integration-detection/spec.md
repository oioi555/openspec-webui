## ADDED Requirements

### Requirement: Recognize Kilo Code current and legacy command paths
The system SHALL recognize repository-local OpenSpec artifacts generated for Kilo Code. Command files under the current `.kilo/command` directory named `opsx-<workflow-id>.*` SHALL be reported as Kilo Code Commands evidence using the `/opsx-<workflow-id>` invocation form. Detection SHALL retain read compatibility for OpenSpec command artifacts under the legacy `.kilocode/workflows` directory. When matching command files exist in both locations for the same workflow id, detection SHALL report the current `.kilo/command` path and SHALL fill remaining workflow ids from the legacy directory. Skill files under `.kilocode/skills/openspec-*/SKILL.md` SHALL continue to be reported as Kilo Code Skills evidence using the `/openspec-*` invocation form. Detection SHALL retain both evidence sets when both deliveries exist.

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
