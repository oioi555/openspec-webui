## MODIFIED Requirements

### Requirement: Discover registered stores read-only
The system SHALL discover registered Stores by invoking only `openspec store list --json`, read-only, normalizing output into store records with at least `id` and root path. Results SHALL feed the Project Selector list and Dashboard Store routing. The system SHALL NOT sync, read, or write the CLI's store registry state, and SHALL run Store subprocess calls as local read-only JSON invocations with defensive parsing. A parse failure SHALL yield a structured diagnostic, not an unhandled error.

#### Scenario: List registered stores
- **WHEN** the system performs Store discovery and the CLI reports one or more registered stores
- **THEN** the system returns structured store records with each store's `id` and root path
- **AND** the invocation used `openspec store list --json` and no other `openspec store` subcommand
- **AND** the CLI's own store registry file and other registry state are not synced, read, or written

#### Scenario: Discovery feeds the unified project list
- **WHEN** Store discovery reports a Store whose root is not a WebUI project
- **THEN** the Store appears by default as a row in the unified Project Selector list
- **AND** no separate Store region, section, heading, or `Open Store` action is created

#### Scenario: Discovery resolves Store relationships for Dashboard routing
- **WHEN** the Dashboard routes a project with a Store relationship
- **THEN** the relationship is resolved from Store discovery results

#### Scenario: Tolerate malformed store list output
- **WHEN** `openspec store list --json` returns output that cannot be parsed as the expected shape
- **THEN** the system reports Store discovery as unavailable with a structured diagnostic describing the failure
- **AND** does not crash or interrupt existing project browsing

### Requirement: Surface store pointer and reference information read-only
The system SHALL surface `store:` pointer projects (resolved root source `declared`, externalized planning) and `references:` (read-only context) as read-only relationship info that enriches rows and routes the Dashboard. An unresolvable declared Store SHALL be a non-blocking unavailable relationship with the official docs link and no invented planning. It SHALL NOT create or modify local planning data or artifacts for them, nor describe them with hierarchy terms.

#### Scenario: Enrich rows with pointer relationship
- **WHEN** the active workspace declares a `store:` pointer or `references:` entries
- **THEN** the system enriches the matching rows with read-only pointer or reference badges
- **AND** does not create local planning data for the pointer or the referenced stores

#### Scenario: Unresolved declared Store is non-blocking
- **WHEN** a `store:` pointer or `references:` entry targets a Store that cannot be resolved from CLI registration
- **THEN** the relationship is reported as a non-blocking unavailable state
- **AND** the official Store documentation link is provided
- **AND** no local planning root or planning content is invented

#### Scenario: Pointer and reference relationships stay read-only
- **WHEN** the system resolves a `store:` pointer or `references:` relationship
- **THEN** no planning data (such as changes, specs, or project data), workset, or project entry is created or modified for the relationship
- **AND** pointers are not followed to create worksets or other local artifacts
- **AND** the relationship is not described with master/slave, parent/child, owner, or other hierarchy-implication terminology

### Requirement: Use centralized current official Store documentation links
Store documentation links SHALL be centralized constants for the official current `main` Store guide and Store CLI reference pages, deliberately living links rather than version-pinned tags, even where other compatibility behavior stays v1.8-scoped. The system SHALL render both as visible external documentation links in the Project Selector header, and SHALL keep them visible whether Store discovery succeeds, reports no Stores, or is unavailable.

#### Scenario: Store guide link renders in the selector header
- **WHEN** the Project Selector renders its header documentation links
- **THEN** the header visibly renders a link to `https://github.com/Fission-AI/OpenSpec/blob/main/docs/stores-beta/user-guide.md`
- **AND** the link is produced by a shared centralized documentation constant

#### Scenario: CLI reference link renders in the selector header
- **WHEN** the Project Selector renders its header documentation links
- **THEN** the header visibly renders a link to `https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#stores-standalone-openspec-repos`
- **AND** the link is produced by a shared centralized documentation constant
