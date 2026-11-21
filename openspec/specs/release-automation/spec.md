# release-automation Specification

## Purpose

Publishes the npm package and its GitHub Release from CI when a version tag is pushed, so a release needs no local credentials or interactive npm authentication.

## Requirements

### Requirement: Publish to npm from a version tag via trusted publishing
Pushing a tag of the form `v<major>.<minor>.<patch>` SHALL start a release workflow that publishes the package to npm using npm trusted publishing (OIDC) from a GitHub-hosted runner. The workflow SHALL NOT use a long-lived npm token, and the published version SHALL carry npm provenance.

#### Scenario: Tag push publishes the package
- **WHEN** the maintainer pushes tag `v2.1.0` for a commit whose `package.json` version is `2.1.0`
- **THEN** the workflow publishes `openspec-webui@2.1.0` to npm without any npm token secret
- **AND** the npm package page shows provenance linked to the workflow run

### Requirement: Reject tags that do not match the package version
Before publishing, the release workflow SHALL fail without publishing when the tag is not exactly `v` followed by the `package.json` version, or when the `package-lock.json` version differs from `package.json`.

#### Scenario: Tag and version disagree
- **WHEN** tag `v2.0.9` is pushed for a commit whose `package.json` version is `2.1.0`
- **THEN** the workflow fails before publishing and nothing is uploaded to npm

### Requirement: Publish only commits that are on main
Before publishing, the release workflow SHALL fail without publishing when the tagged commit is not an ancestor of the remote `main` branch.

#### Scenario: Tag on an unmerged commit
- **WHEN** a version tag points at a commit that is not reachable from `origin/main`
- **THEN** the workflow fails before publishing

### Requirement: Require committed release notes
Each release SHALL have human-written release notes committed at `.github/release-notes/v<version>.md`. The release workflow SHALL fail before publishing when that file is missing or empty.

#### Scenario: Notes file missing
- **WHEN** a version tag is pushed and `.github/release-notes/v<version>.md` does not exist in the tagged commit
- **THEN** the workflow fails before publishing

### Requirement: Verify the package before uploading it
The release workflow SHALL run the repository's full release verification (license notices, build, tests, type checks, tarball contents and packed CLI smoke test) on the tagged tree and SHALL NOT upload the package if any check fails. It SHALL also fail when regenerated license notices differ from the committed file.

#### Scenario: A verification check fails
- **WHEN** any release verification step fails during the release workflow
- **THEN** the package is not published and no GitHub Release is created

### Requirement: Create the GitHub Release after publishing
After the version is available on npm, the release workflow SHALL create a GitHub Release named `v<version>` for the tag, using the committed release notes file as its body.

#### Scenario: Successful release
- **WHEN** publishing succeeds
- **THEN** a GitHub Release `v<version>` exists whose body is the content of `.github/release-notes/v<version>.md`

### Requirement: Re-running a release is safe
Re-running the release workflow for a tag SHALL NOT fail because earlier work already succeeded: when the version is already on npm it SHALL skip publishing and continue to the GitHub Release, and when that Release already exists it SHALL leave it unchanged and succeed.

#### Scenario: Re-run after a failed Release step
- **WHEN** the workflow is re-run for a tag whose version is already on npm and whose GitHub Release does not exist
- **THEN** publishing is skipped and the GitHub Release is created

#### Scenario: Re-run after a complete release
- **WHEN** the workflow is re-run for a tag whose version is on npm and whose GitHub Release exists
- **THEN** the run succeeds without publishing or modifying the Release

### Requirement: Release workflow uses least privilege
The release workflow SHALL default to read-only repository permissions, grant OIDC token issuance only to the publishing job, grant release write access only to the release job, bound every job with a timeout, and never run two releases for the same tag concurrently.

#### Scenario: Permissions are scoped per job
- **WHEN** the workflow definition is inspected
- **THEN** only the publish job has `id-token: write` and only the release job has `contents: write`
