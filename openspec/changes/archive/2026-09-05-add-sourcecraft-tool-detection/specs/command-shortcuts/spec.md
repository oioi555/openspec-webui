## ADDED Requirements

### Requirement: Generate SourceCraft skill prompt candidates
The system SHALL represent SourceCraft's documented natural-language skill activation as a stable invocation form and SHALL generate a copyable `use the openspec-<skill> skill` prompt only from matching SourceCraft Skills evidence. The form SHALL interpolate the workflow's canonical OpenSpec skill name. Workspace-scoped prompts SHALL contain no positional argument, while change-scoped prompts SHALL append ` for <change-name>`. Matching SourceCraft Commands evidence SHALL retain the existing Commands-first priority and use `/opsx-<workflow-id>` instead of offering a second SourceCraft Skills choice for the same workflow.

#### Scenario: Generate a SourceCraft workspace skill prompt
- **WHEN** SourceCraft Skills evidence contains `openspec-propose` and no SourceCraft command exists for `propose`
- **THEN** the `propose` shortcut candidate is `use the openspec-propose skill`
- **AND** the candidate is attributed to SourceCraft

#### Scenario: Generate a SourceCraft change-scoped skill prompt
- **WHEN** SourceCraft Skills evidence contains `openspec-apply-change`, no SourceCraft command exists for `apply`, and the active change is `add-login`
- **THEN** the `apply` shortcut candidate is `use the openspec-apply-change skill for add-login`

#### Scenario: SourceCraft command evidence wins over skill evidence
- **WHEN** SourceCraft has matching Commands and Skills evidence for the same workflow
- **THEN** the candidate uses `/opsx-<workflow-id>`
- **AND** no natural-language SourceCraft Skills candidate is added for that workflow

#### Scenario: Group an identical SourceCraft prompt candidate
- **WHEN** multiple detected evidence entries produce the same final SourceCraft prompt text
- **THEN** the system exposes one grouped copy choice
- **AND** preserves the associated tool labels without duplication

#### Scenario: Do not synthesize SourceCraft prompts
- **WHEN** no matching SourceCraft command or skill artifact exists for a workflow
- **THEN** SourceCraft contributes no candidate for that workflow
