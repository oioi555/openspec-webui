## MODIFIED Requirements

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
