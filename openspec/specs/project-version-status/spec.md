## Purpose

登録された各プロジェクトがどの OpenSpec CLI バージョンで生成されたかを検出し、現在の CLI バージョンと比較して、プロジェクトごとの更新状態を外部に公開する。

## Requirements

### Requirement: Detect per-project OpenSpec generation version
The system SHALL detect the OpenSpec generation version for each registered project by reading the version recorded in the frontmatter of an OpenSpec-generated skill file (`metadata.generatedBy`) within that project. Detection SHALL be read-only and SHALL NOT modify, create, or delete any file in the project. Detection SHALL scan the standard skill directories that OpenSpec generates for representative AI tools, including the shared `.agents/skills` root used by Codex and vendor-neutral agent skills.

#### Scenario: Generation version is readable from a skill file
- **WHEN** a registered project contains an OpenSpec-generated skill file
- **AND** that file's frontmatter records a version in `metadata.generatedBy`
- **THEN** the system reports that recorded version as the project's generation version

#### Scenario: Generation version is readable from the shared agents skill root
- **WHEN** a registered project's only OpenSpec-generated skill file is under `.agents/skills`
- **AND** that file's frontmatter records a version in `metadata.generatedBy`
- **THEN** the system reports that recorded version as the project's generation version

#### Scenario: No skill file exists or version is unreadable
- **WHEN** a registered project contains no OpenSpec-generated skill file
- **OR** a skill file exists but `generatedBy` is absent or unreadable
- **THEN** the system reports the project's generation version as unknown
- **AND** does not raise an error and continues detection for other projects

#### Scenario: Detection does not touch project files
- **WHEN** the system detects a project's generation version
- **THEN** no file in the project is modified, created, or deleted

### Requirement: Compare per-project generation version against the current CLI version
The system SHALL compare each project's detected generation version against the current (global) OpenSpec CLI version to derive a per-project update status. The status SHALL be `up-to-date` when the generation version equals the current CLI version, `update-available` when the current CLI version is newer, and `unknown` when the generation version could not be detected.

#### Scenario: Generation version equals the current CLI version
- **WHEN** a project's generation version equals the current OpenSpec CLI version
- **THEN** the system reports that project's status as up-to-date

#### Scenario: Current CLI version is newer than the generation version
- **WHEN** the current OpenSpec CLI version is newer than the project's generation version
- **THEN** the system reports that project's status as update-available

#### Scenario: Generation version is unknown
- **WHEN** a project's generation version could not be detected
- **THEN** the system reports that project's status as unknown

#### Scenario: Current CLI version is unavailable
- **WHEN** the current OpenSpec CLI version cannot be determined because the CLI is not installed or cannot be executed
- **THEN** the system reports every project's status as unknown

### Requirement: Expose per-project version status through the API
The system SHALL expose the version status of each registered project through the API. For each project, the response SHALL include the project path, the detected generation version, the current CLI version used as the comparison baseline, and the update status (`up-to-date` / `update-available` / `unknown`). The status SHALL be recomputed on server startup and on an explicit manual refresh request. Any per-project detection failure SHALL NOT fail the API response as a whole and SHALL be represented as `unknown` for the affected project.

#### Scenario: Retrieve status for registered projects
- **WHEN** the client requests the per-project version status
- **THEN** the response includes each registered project
- **AND** each entry includes path, generation version, current CLI version, and update status

#### Scenario: Manual refresh recomputes status
- **WHEN** the client requests a manual refresh of the per-project version status
- **THEN** the system re-runs detection for each project
- **AND** returns the recomputed status
- **AND** the recomputed status includes projects registered since the previous computation

#### Scenario: A partial detection failure does not break the response
- **WHEN** detection fails for some projects
- **THEN** the response still succeeds
- **AND** each failed project is represented with the `unknown` status

#### Scenario: No projects are registered
- **WHEN** the client requests the per-project version status
- **AND** no projects are registered
- **THEN** the response contains an empty project list and the current CLI version
