# project-selector-ui Specification

## Purpose
Project selection, addition, and switching UI components.

## Requirements

### Requirement: Add-project dialog
The web UI SHALL render a dedicated AddProjectDialog component when `layoutStore.overlay` is set to `'add-project'`. The dialog SHALL prioritize directory browsing, SHALL show which subdirectories contain an `openspec/` folder, SHALL provide a manual path fallback, and SHALL show a concise initialization hint that points to OpenSpec installation and `openspec init` setup documentation. Selecting the current directory or submitting a manual path SHALL add and activate that project. After the API add or reactivate step completes, the client SHALL complete a WebSocket `project:bind` flow for the returned project before treating that project as ready. The manual path fallback SHALL accept any non-empty string without absolute-path validation; the server validates the path.

#### Scenario: Open add-project dialog from empty state
- **WHEN** the operator clicks the primary add-project action from the empty project state
- **THEN** the dedicated add-project dialog opens
- **AND** a directory browser is shown immediately
- **AND** the dialog shows a concise initialization hint with links to setup documentation

#### Scenario: Browse and add current directory
- **WHEN** the operator navigates directories in the add-project dialog and chooses the currently displayed directory
- **THEN** a POST request is sent to `/api/projects`
- **AND** the client sends WebSocket `project:bind` for the returned project id
- **AND** the selected directory becomes the active project after the `project:bound` response has reinitialized project-scoped data
- **AND** the add-project dialog closes

#### Scenario: Manual path fallback
- **WHEN** the operator expands the manual path section in the add-project dialog and submits a path
- **THEN** a POST request is sent to `/api/projects`
- **AND** the client sends WebSocket `project:bind` for the returned project id
- **AND** the selected directory becomes the active project after the `project:bound` response has reinitialized project-scoped data
- **AND** the add-project dialog closes

#### Scenario: Explain missing initialization in AddProjectDialog
- **WHEN** the operator opens the add-project dialog for a directory that does not contain an `openspec/` folder
- **THEN** the dialog explains that the repository must be initialized with `openspec init`
- **AND** the dialog provides a link to the setup documentation

### Requirement: Empty state when no projects
The web UI SHALL display an empty state view in the Main Viewer when no projects are registered. The empty state SHALL explain that OpenSpec must be installed and the target repository must be initialized with `openspec init` before it can be added, SHALL include links to OpenSpec installation and setup documentation, and SHALL provide a button to open the add-project dialog. The empty state SHALL NOT show the Explorer Pane or Dashboard content.

#### Scenario: First startup with no projects
- **WHEN** the application loads and the project registry is empty
- **THEN** the Main Viewer shows an empty state with onboarding guidance, setup links, and an add-project button
- **AND** the Explorer Pane is hidden

#### Scenario: Open setup docs from empty state
- **WHEN** the operator clicks a setup documentation link in the empty state
- **THEN** the browser opens the OpenSpec setup documentation

#### Scenario: Reuse shared OpenSpec docs links in onboarding surfaces
- **WHEN** the empty state or add-project dialog renders OpenSpec documentation links
- **THEN** both surfaces reuse the same shared OpenSpec docs URL constants
- **AND** the install link points to the OpenSpec installation docs
- **AND** the setup link points to the OpenSpec CLI setup docs

#### Scenario: Remove last project
- **WHEN** the operator removes the only registered project
- **THEN** the Main Viewer transitions to the empty state
- **AND** the Explorer Pane is hidden

### Requirement: Project switch loading state
The web UI SHALL display a loading indicator during project switching. The loading indicator SHALL appear immediately when the operator selects a different project or adds/reactivates a project and SHALL disappear only after the new project's data has been fully loaded from the `project:bound`-triggered refresh.

#### Scenario: Loading during switch
- **WHEN** the operator switches to a different project
- **THEN** a loading indicator is shown
- **AND** the indicator disappears when the new project data is loaded

#### Scenario: Loading during initial add
- **WHEN** the operator adds a new project (which becomes active)
- **THEN** a loading indicator is shown during parsing and binding
- **AND** the indicator disappears when the project data is loaded

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
