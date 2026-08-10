# store-discovery Specification

## Purpose
Provides read-only discovery of OpenSpec v1.8 Stores registered on this machine, feeding the unified Project Selector list and Dashboard relationship routing, without lifecycle operations, registry writes, or a Store catalog sidebar.

## Requirements

### Requirement: Discover registered stores read-only
The system SHALL discover registered Stores by invoking only `openspec store list --json` in a read-only manner and SHALL normalize the output into structured store records containing at least the store `id` and root path. Discovery results SHALL be one of the sources for the unified Project Selector list so Store-only roots appear by default, and SHALL be used to resolve Store relationships for Dashboard routing. The system SHALL NOT sync, read, or write the CLI's own store registry file or other registry state, SHALL NOT invoke any other `openspec store` subcommand, and SHALL run all Store subprocess calls as local read-only JSON invocations with defensive parsing. When parsing fails, the system SHALL record a structured diagnostic describing the failure instead of raising an unhandled error.

#### Scenario: List registered stores
- **WHEN** the system performs Store discovery and the CLI reports one or more registered stores
- **THEN** the system returns structured store records with each store's `id` and root path
- **AND** the invocation used `openspec store list --json` and no other `openspec store` command

#### Scenario: Discovery feeds the unified project list
- **WHEN** Store discovery reports a Store whose root is not a WebUI project
- **THEN** the Store appears as a row in the unified Project Selector list
- **AND** no separate Store region, section, heading, or `Open Store` action is created

#### Scenario: Tolerate malformed store list output
- **WHEN** `openspec store list --json` returns output that cannot be parsed as the expected shape
- **THEN** the system reports Store discovery as unavailable with a structured diagnostic
- **AND** does not crash or interrupt existing project browsing

### Requirement: Surface store pointer and reference information read-only
The system SHALL surface `store:` pointer projects and `references:` as read-only relationship information used to enrich rows and route the Dashboard. A `store:` project is a pointer whose resolved root source is `declared` (externalized planning), and `references:` are read-only context. When a declared Store cannot be resolved from CLI registration, the system SHALL report a non-blocking unavailable relationship with the official documentation link and SHALL NOT invent a local planning root or other planning content. The system SHALL NOT create or modify local planning data (for example changes, specs, or project data) for pointers or references, SHALL NOT follow pointers to create worksets or other local artifacts, and SHALL NOT use master/slave, parent/child, owner, or other hierarchy-implication terminology when describing these relationships.

#### Scenario: Enrich rows with pointer relationship
- **WHEN** the active workspace declares a `store:` pointer or `references:` entries
- **THEN** the system enriches the matching rows with read-only pointer or reference badges
- **AND** does not create local planning data for the pointer or the referenced stores

#### Scenario: Unresolved declared Store is non-blocking
- **WHEN** a `store:` pointer or `references:` entry targets a Store that is not registered with the CLI
- **THEN** the relationship is reported as a non-blocking unavailable state
- **AND** the official Store documentation link is provided
- **AND** no local planning root or planning content is invented

#### Scenario: Pointer and reference relationships stay read-only
- **WHEN** the system resolves a `store:` pointer or `references:` relationship
- **THEN** no planning data, workset, or project entry is created or modified for the relationship

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
Store documentation links SHALL be centralized constants pointing to the official current `main` pages, which are deliberately living links rather than version-pinned tags: the Store guide `https://github.com/Fission-AI/OpenSpec/blob/main/docs/stores-beta/user-guide.md` and the Store CLI reference `https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#stores-standalone-openspec-repos`. The system SHALL render both links as visible external documentation links in the Project Selector header, and SHALL keep them visible whether Store discovery succeeds, reports no Stores, or is unavailable. Other version-specific compatibility behavior may remain v1.8-scoped, but these beta Store guidance links SHALL point to the official current pages.

#### Scenario: Store guide link renders in the selector header
- **WHEN** the Project Selector renders its header documentation links
- **THEN** the header visibly renders a link to `https://github.com/Fission-AI/OpenSpec/blob/main/docs/stores-beta/user-guide.md`
- **AND** the link is produced by a shared centralized documentation constant

#### Scenario: CLI reference link renders in the selector header
- **WHEN** the Project Selector renders its header documentation links
- **THEN** the header visibly renders a link to `https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#stores-standalone-openspec-repos`
- **AND** the link is produced by a shared centralized documentation constant
