# store-discovery Specification

## Purpose
Provides read-only discovery of OpenSpec v1.8 Stores registered on this machine, feeding the unified Project Selector list and Dashboard relationship routing, without lifecycle operations, registry writes, or a Store catalog sidebar.

## Requirements

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

### Requirement: Store lifecycle actions are out of scope with terminal guidance
The system SHALL NOT expose WebUI actions for Store lifecycle management, including `store setup`, `store register`, `store unregister`, `store remove`, workset management, Git or remote operations, `--store` execution paths, or a Store doctor UI/API. Where Store lifecycle guidance is needed, the system SHALL present concise guidance that these operations are performed in the terminal where output is visible, alongside the official Store guide and Store CLI reference documentation links.

#### Scenario: Store lifecycle guidance references the terminal
- **WHEN** a Store surface needs lifecycle actions such as creating, registering, or removing a Store
- **THEN** the surface shows concise guidance directing the operator to perform the operation in the terminal
- **AND** provides the official Store guide and Store CLI reference documentation links

#### Scenario: No lifecycle actions in the WebUI
- **WHEN** the operator inspects Store-related UI surfaces
- **THEN** no setup, register, unregister, remove, workset, Git/remote, `--store`, or doctor action is available in the WebUI

### Requirement: Store discovery degrades gracefully
Store discovery SHALL degrade gracefully when the OpenSpec CLI is missing, is an unsupported version, or fails to list stores: the system SHALL continue to serve existing project browsing normally and SHALL make Store discovery unavailable with non-blocking guidance rather than returning an application error. The Project Selector header documentation links SHALL remain visible in the unavailable state.

#### Scenario: CLI unavailable during Store discovery
- **WHEN** Store discovery is requested and the OpenSpec CLI is not installed or cannot be executed
- **THEN** Store discovery reports an unavailable state with guidance
- **AND** existing project browsing continues to work

#### Scenario: Store list fails during discovery
- **WHEN** `openspec store list --json` fails or times out
- **THEN** Store discovery reports an unavailable state with guidance
- **AND** no application-level error breaks the current project session

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
