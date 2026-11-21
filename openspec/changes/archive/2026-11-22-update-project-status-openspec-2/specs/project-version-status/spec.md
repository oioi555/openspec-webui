## ADDED Requirements

### Requirement: Derive 2.x project status from the OpenSpec dry run
For an OpenSpec CLI of major version 2 or later, the system SHALL derive each registered project's status from a read-only `openspec update --dry-run --json` run in that project: `update-available` with the file count when changes are listed, else `legacy-cleanup` when a `legacy-artifacts` note is present, else `up-to-date`. A failed or unparseable run SHALL yield `unknown` for that project only. Runs SHALL happen at startup and on manual refresh with bounded concurrency.

#### Scenario: Stale project skills
- **WHEN** the dry run lists `.agents/skills/openspec-propose/SKILL.md` as an update
- **THEN** the project's status is `update-available` with 1 changed file

#### Scenario: Global-only repository
- **WHEN** the dry run in a repository without its own skills lists no changes and no legacy note
- **THEN** the project's status is `up-to-date`, not `unknown`

#### Scenario: Leftover 1.x files
- **WHEN** the dry run lists no changes and carries a `legacy-artifacts` note
- **THEN** the project's status is `legacy-cleanup`

### Requirement: Report machine-wide skill status
For a 2.x CLI, the system SHALL report one machine-wide skill status. It SHALL be `update-available` when any project's dry run carries a `global-skills` note, `up-to-date` when at least one dry run succeeded without that note, and `unknown` otherwise. The API SHALL expose it beside the per-project list.

#### Scenario: Machine skills are stale
- **WHEN** a dry run carries the `global-skills` note
- **THEN** the machine-wide status is `update-available`
