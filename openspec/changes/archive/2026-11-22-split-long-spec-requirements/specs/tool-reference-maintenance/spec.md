## MODIFIED Requirements

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
