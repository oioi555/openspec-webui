## ADDED Requirements

### Requirement: Inventory workflow-specific OpenSpec integration artifacts
The system SHALL detect OpenSpec-generated tool-specific Commands and Skills artifacts present in the active repository and SHALL retain enough artifact-level evidence to determine, independently for each workflow, whether each tool has a matching Commands artifact, a matching Skills artifact, or both. Detection SHALL associate command artifacts with workflow ids and skill artifacts with OpenSpec skill names, invocation forms, delivery types, and source paths. Detection SHALL look for real OpenSpec-generated artifacts only, SHALL NOT attempt to detect the AI tool executable itself or global integrations, SHALL NOT treat empty directories as evidence, and SHALL degrade safely when a configured path cannot be read.

The system SHALL continue to report detected integrations in Settings as repository-local configuration rather than claiming that an AI tool executable is installed. Repository-local artifact evidence SHALL nevertheless be authoritative for command-shortcut candidate eligibility: a workflow without a matching detected artifact SHALL not receive a candidate.

The shared `.agents/skills` root SHALL remain explicitly ambiguous between the Shared `.agents` and Codex invocation forms because those targets use the same artifact layout; detection SHALL retain that ambiguity rather than asserting that either executable is installed.

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

#### Scenario: Shared agents root remains ambiguous
- **WHEN** a matching skill artifact is detected under `.agents/skills`
- **THEN** detection identifies the shared artifact evidence without asserting a single target
- **AND** exposes both documented invocation-form interpretations for candidate resolution

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

## REMOVED Requirements

### Requirement: Detect OpenSpec tool integrations in the repository

**Reason**: Representative per-tool detection discards workflow-level and dual-delivery evidence and previously allowed synthetic copy candidates when no matching artifact existed.

**Migration**: Use `Inventory workflow-specific OpenSpec integration artifacts`; Settings continues to present repository-local integration information while shortcut eligibility uses exact artifact evidence.

### Requirement: Expose detected integrations and forms via the API

**Reason**: Aggregate tool/form candidates cannot represent partial workflow installation or preserve both Commands and Skills evidence.

**Migration**: Use `Expose workflow-specific integration evidence via the API`; legacy aggregate response fields may remain temporarily for compatibility but are not authoritative for shortcut generation.
