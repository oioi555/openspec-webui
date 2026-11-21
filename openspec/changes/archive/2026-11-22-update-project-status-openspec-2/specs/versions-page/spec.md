## ADDED Requirements

### Requirement: Versions page separates machine and repository updates
For a 2.x CLI, the Versions page SHALL explain that one `openspec update` refreshes this machine's skills for every project and that only repositories keeping their own skills need their own run. It SHALL show one machine-wide row with its status and a copyable `openspec update`. The project list SHALL offer `openspec update <path>` only for `update-available` or `legacy-cleanup` projects.

#### Scenario: Only machine skills are stale
- **WHEN** the machine-wide status is `update-available` and every project is `up-to-date`
- **THEN** the page shows the machine row with `openspec update` and no per-project copy actions

#### Scenario: A team repository is stale
- **WHEN** one project is `update-available` with 3 files
- **THEN** that row shows 3 files and copies `openspec update <path>`

### Requirement: Explain leftover 1.x files
A `legacy-cleanup` project row SHALL explain that OpenSpec removes leftover 1.x files only with `openspec update --force` or an interactive confirmation, and SHALL copy `openspec update --force <path>`.

#### Scenario: Copy the cleanup command
- **WHEN** the operator copies from a `legacy-cleanup` row for `/work/app`
- **THEN** `openspec update --force /work/app` is copied
