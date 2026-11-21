# tool-reference-maintenance Specification

## Purpose

Defines a lightweight, repeatable workflow for OpenSpec tool definitions and the Shared `.agents/skills` mapping. The shared mapping is a reference list whose primary provenance is `vercel-labs/skills`; no per-client exhaustive vendor-doc sweep is required.

## Requirements

### Requirement: Store official definitions and shared mapping separately
The system SHALL maintain the pinned OpenSpec tool-definition snapshot and the Shared `.agents/skills` mapping as separate schema-versioned JSON datasets: the official one records its upstream URL, immutable revision, and check date; the shared one records its single source (`vercel-labs/skills` commit) and dataset-level `updatedAt`. Both SHALL ship in production builds and npm packages without runtime network access, and loading them SHALL preserve the tool-reference API response shape.

#### Scenario: Load packaged reference data offline
- **WHEN** the WebUI starts from a built npm package without network access
- **THEN** it loads the official definitions and Shared `.agents/skills` mapping from packaged data
- **AND** returns the existing tool-reference API shape (official + sharedSource + sharedCompatibility)

#### Scenario: Keep authorities separate
- **WHEN** an operator inspects the stored data
- **THEN** OpenSpec's supported-tool definitions and the shared mapping have separate source metadata
- **AND** the shared list's primary provenance is `https://github.com/vercel-labs/skills`

### Requirement: Build a candidate union from 2 sources
The maintenance workflow SHALL build its candidate set from OpenSpec's official `supported-tools.md` at the caller-selected release and the `vercel-labs/skills` Supported Agents source, joining them on exact tool id first and then on a reviewed client-id alias map to decide `openSpecToolId`. An alias SHALL apply only when the research client id is absent from the official id set and the alias target is present in it. Per-client evidence collection SHALL NOT be required.

#### Scenario: Add a newly listed client as a candidate
- **WHEN** a client appears in OpenSpec or the Vercel Supported Agents source for the first time
- **THEN** the maintenance workflow reports it as a new candidate and adds a flat `{ id, name, openSpecToolId?, note? }` entry
- **AND** does not require per-client vendor-doc verification
- **AND** may keep a short `note` for exceptions, such as Hermes global requiring config

#### Scenario: Retain a disappeared client report
- **WHEN** a previously recorded client is absent from the current union
- **THEN** the update report identifies the disappearance; the next written dataset reflects the current union

#### Scenario: Join Grok Build on the reviewed alias
- **WHEN** the Vercel research list contains client id `grok-build` and the pinned official snapshot contains tool id `grok`
- **THEN** the shared record receives `openSpecToolId` `grok`
- **AND** a later maintenance write that rebuilds the shared list from the same candidate ids keeps that linkage

#### Scenario: Keep unaliased mismatched ids unlinked
- **WHEN** a research client id is absent from the official id set and has no reviewed alias
- **THEN** the shared record has no `openSpecToolId`

#### Scenario: Vercel candidates come from shared-path agents
- **WHEN** the workflow reads the `vercel-labs/skills` Supported Agents source
- **THEN** it uses `src/agents.ts` entries whose `skillsDir === '.agents/skills'`

#### Scenario: Exact id takes precedence over an alias
- **WHEN** a research client id matches an official tool id exactly and also has an alias entry
- **THEN** the exact id match decides `openSpecToolId`

#### Scenario: Alias map includes Grok Build
- **WHEN** the pinned official snapshot uses id `grok` for Grok Build
- **THEN** the reviewed alias map includes `grok-build` → `grok`

### Requirement: Update on upstream releases or explicit requests
The maintenance skill SHALL run only when an operator or automation caller invokes it with a target OpenSpec CLI release/tag, and SHALL NOT poll for releases, schedule itself, decide when to run, or initiate automation. Before processing external candidates, it SHALL load and pin the official definitions from that release. It SHALL also accept an explicit targeted or full refresh request regardless of dataset age.

#### Scenario: Caller invokes maintenance for a CLI release
- **WHEN** an operator invokes the skill with a target OpenSpec CLI release/tag
- **THEN** the workflow loads the official tool definitions for that exact release before loading external candidates
- **AND** classifies candidate ids as official or external relative to the pinned release

#### Scenario: Skill is not invoked
- **WHEN** no operator invokes the skill for a release
- **THEN** the skill performs no release detection or dataset updates

#### Scenario: Sources are unchanged
- **WHEN** candidate-source revisions and client memberships are unchanged
- **THEN** the workflow reports that no update is required
- **AND** does not rewrite the datasets

#### Scenario: Explicit refresh regardless of age
- **WHEN** an operator explicitly requests a targeted or full refresh
- **THEN** the workflow runs the refresh regardless of dataset age
- **AND** no fixed day threshold is applied

### Requirement: Reconcile official release documentation before updating definitions
Before proposing an official snapshot, the maintenance workflow SHALL inspect both `docs/supported-tools.md` and the official GitHub release notes for the caller-selected release, treating release notes as formal release data. A disagreement about a tool path, invocation, delivery, migration, or ownership rule SHALL be reported in the analyze-first review, SHALL block an automatic no-change conclusion, and SHALL need an explicit reviewed resolution before writing.

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

#### Scenario: Disagreements are never resolved silently
- **WHEN** the two official sources disagree
- **THEN** the workflow does not silently select the older or less specific statement
- **AND** the review output identifies the source used for each proposed reconciliation

#### Scenario: Retrieval failure is not a disappearance
- **WHEN** either official source cannot be retrieved
- **THEN** official-definition updates fail closed
- **AND** the failure is not interpreted as evidence that a previously recorded definition disappeared

### Requirement: Produce a reviewable dry-run diff before writing
The repository maintenance skill SHALL default to a non-writing analysis that reports source revisions, added/missing clients, and validation failures. Writing updated data SHALL require an explicit write step after the proposed diff is available for review.

Writes SHALL validate both datasets before replacing either file.

#### Scenario: Run maintenance without write authorization
- **WHEN** the update skill is invoked in its default mode
- **THEN** it gathers and validates available source information and prints a diff
- **AND** leaves tracked datasets unchanged

#### Scenario: Apply an approved update
- **WHEN** an operator explicitly requests the write step after reviewing the diff
- **THEN** the workflow validates the complete proposed data and writes both datasets
- **AND** prints the applied source revisions and record changes

### Requirement: Fail closed on unavailable sources
The maintenance workflow SHALL distinguish a source retrieval or parsing failure from a client disappearing in a successfully retrieved source. An unavailable or malformed source SHALL be reported and SHALL NOT cause records from that source to be marked missing or removed for that run.

#### Scenario: Candidate source cannot be retrieved
- **WHEN** OpenSpec or the Vercel candidate source fails to download or parse
- **THEN** the workflow reports that source as unavailable
- **AND** does not infer removals or write source-derived changes from the incomplete run

### Requirement: Keep runtime detection changes explicit
Updating the official definition dataset SHALL NOT automatically make a new tool eligible for repository integration detection or command candidates. Detection eligibility SHALL remain an explicit WebUI-maintained allowlist and SHALL fail tests if a referenced official definition disappears or changes to an unsupported path shape.

#### Scenario: OpenSpec adds a new supported tool
- **WHEN** the official definition snapshot gains a new tool id
- **THEN** the tool appears in the reference definition data after update
- **AND** repository detection remains unchanged until its allowlist and regression coverage are deliberately updated

#### Scenario: A detected definition becomes incompatible
- **WHEN** an official path or invocation shape used by an allowlisted detector can no longer be normalized
- **THEN** validation or detector regression tests fail with that tool id
- **AND** the detector does not silently drop the tool

### Requirement: Select the official supported-tools page by release line
For a caller-selected OpenSpec release `v2.0.0` or later, the maintenance workflow SHALL read the official supported-tools definitions from `docs-lab/reference/supported-tools.md` at that release. For earlier releases it SHALL read `docs/supported-tools.md`. The official dataset's source URL SHALL name the page that was actually read. Release-note reconciliation SHALL apply to whichever page is selected.

#### Scenario: Pin a 2.x release
- **WHEN** the caller selects `v2.1.1`
- **THEN** the workflow reads `docs-lab/reference/supported-tools.md` at `v2.1.1`
- **AND** the written official dataset's source URL points to that page

#### Scenario: Pin a 1.x release
- **WHEN** the caller selects `v1.14.0`
- **THEN** the workflow reads `docs/supported-tools.md` at `v1.14.0`

### Requirement: Maintain tool skill scope support from the bundled skills package
The maintenance workflow SHALL record, for each official tool id, whether the tool reads the universal `.agents/skills` folder, uses its own global skills folder (with that folder and any environment override), or has no global skills folder. The values SHALL come from the `skills` package version declared in the selected OpenSpec release's `package.json`, and the stored data SHALL carry that version. The dry-run diff SHALL report entry changes.

#### Scenario: Pin v2.1.1
- **WHEN** the caller selects `v2.1.1`, whose `package.json` declares `skills` `1.8.1`
- **THEN** the scope data is built from `skills@1.8.1`
- **AND** `eve` and `promptscript` are recorded as having no global skills folder

#### Scenario: A tool's global folder changes in a new release
- **WHEN** a later OpenSpec release bundles a `skills` version that changes a tool's global folder
- **THEN** the dry-run diff reports the changed folder for that tool id
- **AND** the packaged data changes only after the approved write
