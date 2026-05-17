## ADDED Requirements

### Requirement: Published package documents intentional runtime permissions
The system SHALL document the published package's intentional runtime permissions in the README, including local network binding, selected project filesystem access, explicit OpenSpec CLI execution, environment/configuration reads, and npm registry version checks.

#### Scenario: User reviews package permissions
- **WHEN** a user reads the README before installing or running the package
- **THEN** the README explains why the package may access the network, shell, environment variables, and filesystem
- **AND** the explanation ties each permission category to a local OpenSpec WebUI feature

#### Scenario: Package documents non-goals for external data transfer
- **WHEN** a user reviews the README security and permissions guidance
- **THEN** the README states that project contents are not sent to external services by normal operation
- **AND** the README identifies npm registry version checks separately from project-content handling

### Requirement: Distributed dependency set avoids known fixable audit findings
The system SHALL keep the npm dependency tree updated so known npm audit findings with available fixes are remediated before publishing a new package version.

#### Scenario: Maintainer verifies dependency advisories
- **WHEN** the maintainer prepares the dependency-update release
- **THEN** `npm audit` reports no remaining known vulnerabilities that can be fixed by the planned dependency updates

#### Scenario: Maintainer verifies package after dependency updates
- **WHEN** dependency metadata or lockfile entries are updated
- **THEN** the existing test, typecheck, build, and package verification workflows pass before publishing
