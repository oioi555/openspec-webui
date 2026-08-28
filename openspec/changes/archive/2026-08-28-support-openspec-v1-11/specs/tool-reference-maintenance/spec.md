## ADDED Requirements

### Requirement: Reconcile official release documentation before updating definitions
The maintenance workflow SHALL inspect both `docs/supported-tools.md` at the caller-selected OpenSpec release/tag and that release's official GitHub release notes before constructing the proposed official definition snapshot. Release notes SHALL be treated as formal release data rather than an external exception. When the two official sources disagree about a tool path, invocation, delivery, migration, or ownership rule, the workflow SHALL report the disagreement in the analyze-first review output and SHALL NOT silently select the older or less specific statement.

The review output SHALL identify the source used for each proposed reconciliation. A source disagreement SHALL prevent an automatic no-change conclusion and SHALL require an explicit reviewed resolution before the datasets are written. Failure to retrieve either official source SHALL fail closed for official-definition updates and SHALL NOT be interpreted as evidence that a previously recorded definition disappeared.

#### Scenario: Release notes and supported-tools documentation agree
- **WHEN** the selected release's official release notes and `docs/supported-tools.md` describe the same tool definition
- **THEN** the workflow builds the proposed official snapshot from the agreed definition
- **AND** reports both official sources as checked

#### Scenario: Official sources disagree about a migrated path
- **WHEN** the release notes announce a tool path migration but the selected tag's `docs/supported-tools.md` still lists the previous path
- **THEN** the analysis reports the exact disagreement and both source references
- **AND** proposes a reviewable resolution based on the released behavior without silently treating the release notes as an exception
- **AND** requires explicit approval before writing the reconciled snapshot

#### Scenario: Official release notes are unavailable
- **WHEN** the selected release's official release notes cannot be retrieved or parsed
- **THEN** the workflow reports the official source as unavailable
- **AND** does not write or infer removals from an official snapshot built with incomplete release information
