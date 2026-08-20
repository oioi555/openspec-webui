# tool-reference-maintenance Specification

## Purpose

Defines a lightweight, repeatable workflow for OpenSpec tool definitions and the Shared `.agents/skills` mapping. The shared mapping is a reference list whose primary provenance is `vercel-labs/skills`; no per-client exhaustive vendor-doc sweep is required.

## Requirements

### Requirement: Store official definitions and shared mapping separately
The system SHALL maintain the pinned OpenSpec tool-definition snapshot and the Shared `.agents/skills` mapping as separate schema-versioned JSON datasets. The official dataset SHALL identify its upstream URL, immutable revision, and check date. The shared dataset SHALL identify its single source (`vercel-labs/skills` commit) and dataset-level `updatedAt`.

Both datasets SHALL be included in production builds and npm packages without requiring runtime network access. Loading the external datasets SHALL preserve the existing tool-reference API response shape.

#### Scenario: Load packaged reference data offline
- **WHEN** the WebUI starts from a built npm package without network access
- **THEN** it loads the official definitions and Shared `.agents/skills` mapping from packaged data
- **AND** returns the existing tool-reference API shape (official + sharedSource + sharedCompatibility)

#### Scenario: Keep authorities separate
- **WHEN** an operator inspects the stored data
- **THEN** OpenSpec's supported-tool definitions and the shared mapping have separate source metadata
- **AND** the shared list's primary provenance is `https://github.com/vercel-labs/skills`

### Requirement: Build a candidate union from 2 sources
The maintenance workflow SHALL build its candidate set from OpenSpec's official `supported-tools.md` at the caller-selected release and the `vercel-labs/skills` Supported Agents source (`src/agents.ts`, `skillsDir === '.agents/skills'`). The workflow SHALL join them on tool id to decide `openSpecToolId`.

No per-client evidence collection is required for this reference. A short `note` MAY be kept for exceptions (e.g. Hermes global requires config).

#### Scenario: Add a newly listed client as a candidate
- **WHEN** a client appears in OpenSpec or the Vercel Supported Agents source for the first time
- **THEN** the maintenance workflow reports it as a new candidate and adds a flat `{ id, name, openSpecToolId?, note? }` entry
- **AND** does not require per-client vendor-doc verification

#### Scenario: Retain a disappeared client report
- **WHEN** a previously recorded client is absent from the current union
- **THEN** the update report identifies the disappearance; the next written dataset reflects the current union

### Requirement: Update on upstream releases or explicit requests
The maintenance skill SHALL be invoked by an operator or automation caller with a target OpenSpec CLI release/tag at release time. It SHALL NOT poll for releases, schedule itself, decide when it should run, or initiate automation. Before processing external candidates, it SHALL load and pin the official definitions from the caller-selected release so official-versus-external classification is relative to that release.

The workflow SHALL also accept an explicit targeted or full refresh request regardless of dataset age. No fixed day threshold is required.

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
