# package-distribution Specification

## Purpose
Define release packaging rules so the published npm package stays consistent, minimal, and verifiable.

## Requirements
### Requirement: Package metadata remains release-consistent
The system SHALL define the published package version in one authoritative metadata source, SHALL use that version for CLI `--version` output and npm package metadata, and SHALL publish package metadata that points to the current `openspec-webui` repository, homepage, bug tracker, and license rather than an outdated upstream package identity.

#### Scenario: CLI version matches package metadata
- **WHEN** the maintainer updates the package version for a release
- **THEN** `openspec-webui --version` reports the same version that appears in the published package metadata

#### Scenario: Package metadata points to the current project
- **WHEN** a user inspects the published npm package metadata
- **THEN** the package name, repository URL, homepage URL, bug tracker URL, and license metadata identify the current `openspec-webui` project

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
