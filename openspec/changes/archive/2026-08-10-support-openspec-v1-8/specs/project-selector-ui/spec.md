## ADDED Requirements

### Requirement: Project selector shows one unified navigable list
The project selector SHALL render one flat, unified, navigable list whose sources are the UNION of existing WebUI projects and CLI-registered Stores from `openspec store list --json`. A registered Store is an ordinary OpenSpec project root and SHALL appear by default in the unified list even when it was not separately added to the WebUI project registry. The selector SHALL NOT render a `Registered Stores` section, region, heading, second list, Store-only sidebar, or a separate `Open Store` row action. Selecting a Store row SHALL use the same normal project selection/activation/binding behavior as any other project row and SHALL NOT require a second manual add-project step. Internal persistence choices are implementation detail; only observable behavior is specified.

#### Scenario: Store-only registration appears in the unified list
- **WHEN** the CLI reports a registered Store whose canonical normalized root path is not a WebUI project
- **THEN** the Store appears by default as an ordinary row in the unified project selector list
- **AND** no `Registered Stores` section, region, heading, second list, or `Open Store` action is rendered

#### Scenario: Store-only row is selectable like any project
- **WHEN** the operator selects a Store-only row in the unified list
- **THEN** the row activates and binds using the same selection/activation flow as any project row
- **AND** the operator does not need a second manual add-project step

#### Scenario: Selector renders one flat list
- **WHEN** the operator opens the project selector with both WebUI projects and registered Stores
- **THEN** all rows render in one flat navigable list without a Store-only grouping or heading

### Requirement: Merge sources by canonical normalized root path
The system SHALL merge WebUI projects and registered Stores by canonical normalized filesystem root path into exactly one row. When a WebUI project and a registered Store share a canonical root, the system SHALL render one row enriched with a `Store` badge and store id. Distinct roots SHALL render as distinct rows. Rows SHALL NOT be filtered out on the basis of Store registration state.

#### Scenario: Duplicate roots collapse to one Store-badged row
- **WHEN** a WebUI project and a registered Store share a canonical normalized root path
- **THEN** the selector renders exactly one row for that root
- **AND** the row shows a `Store` badge and store id

#### Scenario: Distinct roots render as distinct rows
- **WHEN** a WebUI project and a registered Store have different canonical normalized root paths
- **THEN** the selector renders a separate row for each root

#### Scenario: Path normalization matches equivalent roots
- **WHEN** a Store root and a WebUI project path refer to the same directory with different lexical forms (for example trailing separators, symlinks, or case differences)
- **THEN** the canonical normalized paths are equal
- **AND** the two sources merge into a single row

### Requirement: Selector rows express Store relationships without hierarchy
Project rows SHALL express relationships using only official Store concepts and SHALL NOT use master/slave, parent/child, owner, or any other terminology implying hierarchy or Store ownership. A project whose canonical root path is a registered Store root SHALL show a `Store` badge. A project that declares a `store:` pointer SHALL show a concise pointer/planning-destination badge (for example `Points to: <id>`), where the pointer's resolved root source is `declared`. A project that declares `references:` SHALL show a `References: N` badge where N is the number of read-only references.

#### Scenario: Store root row shows Store badge
- **WHEN** the selector renders a row whose canonical root path is a registered Store root
- **THEN** the row shows a `Store` badge
- **AND** no parent/child or ownership terminology is used

#### Scenario: Pointer project shows planning-destination badge
- **WHEN** the selector renders a project that declares a `store:` pointer with a declared root source
- **THEN** the row shows a concise pointer badge such as `Points to: <id>`
- **AND** the badge uses pointer terminology rather than hierarchy terminology

#### Scenario: References project shows count badge
- **WHEN** the selector renders a project that declares `references:`
- **THEN** the row shows a `References: N` badge where N is the number of references
- **AND** the references are presented as read-only context

### Requirement: Selector header shows official Store documentation links
The project selector SHALL render visible Store documentation links in its HEADER near the list context, and SHALL NOT reproduce or summarize Store concepts, setup, registration, removal, or lifecycle instructions in the WebUI — Stores are beta and the official documentation is authoritative and live. The links SHALL use centralized constants pointing to the official current `main` pages: the Store guide `https://github.com/Fission-AI/OpenSpec/blob/main/docs/stores-beta/user-guide.md` and the Store CLI reference `https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#stores-standalone-openspec-repos`, with suggested visible labels `OpenSpec Stores Guide` and `Store CLI Reference` (localized equivalents). The links SHALL remain visible whether Store discovery succeeds, reports no Stores, or is unavailable, and discovery errors SHALL be non-blocking.

#### Scenario: Header renders both exact current links
- **WHEN** the operator opens the project selector
- **THEN** the selector header visibly renders a link to `https://github.com/Fission-AI/OpenSpec/blob/main/docs/stores-beta/user-guide.md`
- **AND** the selector header visibly renders a link to `https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#stores-standalone-openspec-repos`
- **AND** both links use the shared centralized constants

#### Scenario: Header links stay visible when discovery is empty
- **WHEN** Store discovery reports no Stores
- **THEN** the selector header keeps the Store guide and Store CLI reference links visible
- **AND** the unified list behavior is unchanged

#### Scenario: Header links stay visible when discovery is unavailable
- **WHEN** Store discovery is unavailable because the CLI is missing or the store list failed
- **THEN** the selector header keeps the Store guide and Store CLI reference links visible
- **AND** the discovery failure is non-blocking and does not affect the WebUI project rows

#### Scenario: WebUI does not summarize Store lifecycle instructions
- **WHEN** the project selector renders its Store documentation links
- **THEN** the WebUI does not reproduce or summarize Store setup, registration, removal, or lifecycle instructions
- **AND** it points to the official documentation instead
