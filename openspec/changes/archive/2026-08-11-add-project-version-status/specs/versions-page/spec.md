## MODIFIED Requirements

### Requirement: Show post-upgrade OpenSpec project guidance
The Versions page SHALL explain that after upgrading OpenSpec CLI, the operator must run `openspec update` in each registered project. The page SHALL take the set of registered project roots from the project registry and, for each project, SHALL display a compact row containing that project's detected generation version, its update status (`up-to-date` / `update-available` / `unknown`), and a small per-project copy action that copies `openspec update <path>`. Paths containing whitespace SHALL be quoted in the copied command so the command runs safely in a shell. The former single `openspec update` command copy is replaced by the per-project copy actions. Projects whose status is `unknown` SHALL still be listed and SHALL still be offered as copy targets.

#### Scenario: Manual refresh updates project statuses
- **WHEN** the operator clicks the refresh control on the Versions page
- **THEN** the global version status is refreshed first
- **AND** the per-project statuses are recomputed afterwards against the refreshed CLI baseline
- **AND** projects registered since the previous computation are included in the recomputed list

#### Scenario: Registered projects exist
- **WHEN** the operator opens Settings and selects `Versions`
- **AND** one or more projects are registered in the project registry
- **THEN** the page explains that `openspec update` must be run after an OpenSpec CLI upgrade
- **AND** the page renders one compact row per registered project showing that project's generation version, update status, and a copy action

#### Scenario: No registered projects exist
- **WHEN** the operator opens Settings and selects `Versions`
- **AND** no projects are registered
- **THEN** the page still explains that `openspec update` must be run after an OpenSpec CLI upgrade
- **AND** the page shows no project list

#### Scenario: Copy the post-upgrade project command
- **WHEN** the operator clicks the copy action on a project row
- **THEN** `openspec update <path>` is copied to the clipboard for that project
- **AND** when the path contains whitespace the copied command wraps the path in quotes

#### Scenario: Projects with unknown status remain visible
- **WHEN** a project's generation version cannot be detected
- **THEN** the page still renders that project with an `unknown` status
- **AND** the per-project copy action remains available

#### Scenario: Update status is scannable at a glance
- **WHEN** the operator views the project list on the Versions page
- **THEN** each project row clearly indicates one of `up-to-date`, `update-available`, or `unknown`
- **AND** projects that still need an update are identifiable without inspecting each row in detail
