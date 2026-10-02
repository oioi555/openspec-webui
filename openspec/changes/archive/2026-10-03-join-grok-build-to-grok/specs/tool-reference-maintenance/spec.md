# Spec Delta

## MODIFIED Requirements

### Requirement: Build a candidate union from 2 sources
The maintenance workflow SHALL build its candidate set from OpenSpec's official `supported-tools.md` at the caller-selected release and the `vercel-labs/skills` Supported Agents source (`src/agents.ts`, `skillsDir === '.agents/skills'`). The workflow SHALL join them on exact tool id first, then on a reviewed client-id alias map, to decide `openSpecToolId`. An alias SHALL apply only when the research client id is absent from the official id set and the alias target is present in the official id set. Exact id SHALL take precedence over an alias. The alias map SHALL include `grok-build` → `grok` while the pinned official snapshot uses id `grok` for Grok Build.

No per-client evidence collection is required for this reference. A short `note` MAY be kept for exceptions (e.g. Hermes global requires config).

#### Scenario: Add a newly listed client as a candidate
- **WHEN** a client appears in OpenSpec or the Vercel Supported Agents source for the first time
- **THEN** the maintenance workflow reports it as a new candidate and adds a flat `{ id, name, openSpecToolId?, note? }` entry
- **AND** does not require per-client vendor-doc verification

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
