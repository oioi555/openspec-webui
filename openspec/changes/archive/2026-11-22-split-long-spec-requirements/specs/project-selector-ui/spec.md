## MODIFIED Requirements

### Requirement: Add-project dialog
The web UI SHALL render a dedicated AddProjectDialog component when `layoutStore.overlay` is `'add-project'`. The dialog SHALL prioritize directory browsing, SHALL mark subdirectories that contain an `openspec/` folder, SHALL provide a manual path fallback, and SHALL show a concise initialization hint. Selecting the current directory or submitting a manual path SHALL add and activate that project, and the client SHALL complete a WebSocket `project:bind` flow before treating it as ready.

#### Scenario: Open add-project dialog from empty state
- **WHEN** the operator clicks the primary add-project action from the empty project state
- **THEN** the dedicated add-project dialog opens
- **AND** a directory browser is shown immediately
- **AND** the dialog shows a concise initialization hint with links to OpenSpec installation and `openspec init` setup documentation

#### Scenario: Directory browser marks OpenSpec folders
- **WHEN** the directory browser lists subdirectories
- **THEN** it shows which subdirectories contain an `openspec/` folder

#### Scenario: Browse and add current directory
- **WHEN** the operator navigates directories in the add-project dialog and chooses the currently displayed directory
- **THEN** a POST request is sent to `/api/projects`
- **AND** the client sends WebSocket `project:bind` for the returned project id
- **AND** the selected directory becomes the active project after the `project:bound` response has reinitialized project-scoped data, which follows the completed API add or reactivate step
- **AND** the add-project dialog closes

#### Scenario: Manual path fallback
- **WHEN** the operator expands the manual path section in the add-project dialog and submits a path
- **THEN** a POST request is sent to `/api/projects`
- **AND** the client accepts any non-empty string without absolute-path validation and leaves path validation to the server
- **AND** the client sends WebSocket `project:bind` for the returned project id
- **AND** the selected directory becomes the active project after the `project:bound` response has reinitialized project-scoped data
- **AND** the add-project dialog closes

#### Scenario: Explain missing initialization in AddProjectDialog
- **WHEN** the operator opens the add-project dialog for a directory that does not contain an `openspec/` folder
- **THEN** the dialog explains that the repository must be initialized with `openspec init`
- **AND** the dialog provides a link to the setup documentation

### Requirement: Project selector shows one unified navigable list
The project selector SHALL render one flat, unified, navigable list from the UNION of WebUI projects and CLI-registered Stores from `openspec store list --json`. A registered Store is an ordinary project root and SHALL appear by default even if not in the WebUI registry. The selector SHALL NOT render any Store-only section, list, sidebar, or `Open Store` action. Selecting a Store row SHALL behave like any project row. Persistence is implementation detail.

#### Scenario: Store-only registration appears in the unified list
- **WHEN** the CLI reports a registered Store whose canonical normalized root path is not a WebUI project
- **THEN** the Store appears by default as an ordinary row in the unified project selector list
- **AND** no `Registered Stores` section, region, heading, second list, or `Open Store` action is rendered

#### Scenario: Store-only row is selectable like any project
- **WHEN** the operator selects a Store-only row in the unified list
- **THEN** the row activates and binds using the same normal selection/activation/binding flow as any project row
- **AND** the operator does not need a second manual add-project step

#### Scenario: Selector renders one flat list
- **WHEN** the operator opens the project selector with both WebUI projects and registered Stores
- **THEN** all rows render in one flat navigable list without a Store-only grouping or heading
- **AND** no `Registered Stores` section, region, heading, second list, Store-only sidebar, or separate `Open Store` row action is rendered

### Requirement: Selector rows express Store relationships without hierarchy
Project rows SHALL express relationships using only official Store concepts and SHALL NOT use master/slave, parent/child, owner, or any other terminology implying hierarchy or Store ownership. Rows SHALL show a `Store` badge for registered Store roots, a concise pointer/planning-destination badge for projects with a declared `store:` pointer, and a `References: N` badge for projects that declare `references:`.

#### Scenario: Store root row shows Store badge
- **WHEN** the selector renders a row whose canonical root path is a registered Store root
- **THEN** the row shows a `Store` badge
- **AND** no parent/child or ownership terminology is used

#### Scenario: Pointer project shows planning-destination badge
- **WHEN** the selector renders a project that declares a `store:` pointer whose resolved root source is `declared`
- **THEN** the row shows a concise pointer badge such as `Points to: <id>`
- **AND** the badge uses pointer terminology rather than hierarchy terminology

#### Scenario: References project shows count badge
- **WHEN** the selector renders a project that declares `references:`
- **THEN** the row shows a `References: N` badge where N is the number of read-only references
- **AND** the references are presented as read-only context

### Requirement: Selector header shows official Store documentation links
The project selector SHALL render visible Store documentation links in its HEADER near the list context, using centralized constants for the official current `main` Store guide and Store CLI reference pages. The WebUI SHALL NOT reproduce or summarize Store concepts, setup, registration, removal, or lifecycle instructions; Stores are beta and the official docs are authoritative. The links SHALL stay visible whatever the discovery outcome, and discovery errors SHALL be non-blocking.

#### Scenario: Header renders both exact current links
- **WHEN** the operator opens the project selector
- **THEN** the selector header visibly renders a link to `https://github.com/Fission-AI/OpenSpec/blob/main/docs/stores-beta/user-guide.md`
- **AND** the selector header visibly renders a link to `https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#stores-standalone-openspec-repos`
- **AND** both links use the shared centralized constants
- **AND** the suggested visible labels are `OpenSpec Stores Guide` and `Store CLI Reference` (or localized equivalents)

#### Scenario: Header links stay visible when discovery succeeds
- **WHEN** Store discovery succeeds
- **THEN** the selector header keeps the Store guide and Store CLI reference links visible

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
- **THEN** the WebUI does not reproduce or summarize Store concepts, setup, registration, removal, or lifecycle instructions
- **AND** it points to the official documentation instead, which is authoritative and live
