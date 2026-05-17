# package-distribution Specification

## Purpose
Define release packaging rules so the published npm package stays consistent, minimal, and verifiable.

## Requirements
### Requirement: Package metadata remains release-consistent
The system SHALL define the published package version in one authoritative metadata source, SHALL use that version for CLI `--version` output and npm package metadata, SHALL publish package metadata that points to the current `openspec-webui` repository, homepage, bug tracker, and license rather than an outdated upstream package identity, and SHALL use a description that accurately reflects the tool's local-first nature without implying remote server infrastructure.

#### Scenario: CLI version matches package metadata
- **WHEN** the maintainer updates the package version for a release
- **THEN** `openspec-webui --version` reports the same version that appears in the published package metadata

#### Scenario: Package metadata points to the current project
- **WHEN** a user inspects the published npm package metadata
- **THEN** the package name, repository URL, homepage URL, bug tracker URL, and license metadata identify the current `openspec-webui` project

#### Scenario: Package description reflects local-first positioning
- **WHEN** a user inspects the published npm package metadata or runs `openspec-webui --help`
- **THEN** the description does not contain "server-side" or other wording that implies a remote server
- **AND** the description communicates the local-first nature of the tool

### Requirement: Distributed package contents are minimal and reproducible
The system SHALL publish only the files required to run the CLI and browser UI, SHALL exclude compiled test artifacts and stale generated files from the tarball, and SHALL make the publishable contents verifiable with `npm pack --dry-run`.

#### Scenario: Tarball excludes compiled tests
- **WHEN** the maintainer runs `npm pack --dry-run`
- **THEN** the tarball contents do not include compiled test files such as `dist/**/*.test.js`, `dist/**/*.test.d.ts`, or their map files

#### Scenario: Tarball reflects a clean build
- **WHEN** the maintainer builds the package from a clean working tree
- **THEN** the publishable tarball contains only files produced by the current build configuration
- **AND** does not include stale outputs left by removed or renamed source files

### Requirement: Third-party attribution is generated and distributed with the package
The system SHALL generate `ThirdPartyNotices.txt` from the package metadata before publish verification and publish, SHALL include the generated notice file in the distributed npm package, and SHALL keep README attribution minimal rather than maintaining a hand-written dependency inventory there.

#### Scenario: Publish updates third-party notices automatically
- **WHEN** the maintainer runs publish verification or `npm publish`
- **THEN** `ThirdPartyNotices.txt` is regenerated from `package.json` dependencies before the tarball is created

#### Scenario: Tarball includes generated notices
- **WHEN** the maintainer runs `npm pack --dry-run`
- **THEN** the tarball includes `ThirdPartyNotices.txt`
- **AND** the notice file is the generated output from the current dependency set

### Requirement: Release verification blocks incomplete publishes
The system SHALL verify the release candidate with build, tests, type checks, tarball inspection, and a smoke test before publish, and SHALL fail the publish workflow when any verification step fails.

#### Scenario: Prepublish verification catches packaging regressions
- **WHEN** a release candidate would include an unexpected tarball file or metadata mismatch
- **THEN** the verification workflow fails before publish

#### Scenario: Smoke test validates the packaged CLI
- **WHEN** the maintainer verifies a release candidate
- **THEN** the packaged CLI can run `--help` and `--version` successfully from the packed artifact

#### Scenario: Dev toolchain remains available for release verification
- **WHEN** the maintainer installs dependencies in an environment that would otherwise omit `devDependencies`
- **THEN** the repository npm configuration keeps the required release toolchain available for `licenses:generate`, build, typecheck, and verification scripts

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
