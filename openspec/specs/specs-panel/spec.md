# specs-panel Specification

## Purpose

Define the dedicated Specs panel that the Activity Bar opens in the Explorer Pane, and how it shows nested capability specs as a collapsible folder tree.

## Requirements

### Requirement: Specs panel is a dedicated Explorer Pane panel
The system SHALL render Specs as a dedicated Explorer Pane panel, shown alone above the project selector footer when the Specs preset is active, in the same way as the Search and Validation panels. The panel SHALL have a fixed header with the Specs title, the spec count, and a `Name` / `Date` sort control, and its tree SHALL use the full remaining panel height.

#### Scenario: Specs preset shows the Specs panel alone
- **WHEN** the Specs preset becomes active
- **THEN** the Explorer Pane shows the Specs panel instead of the Active Changes and Archive section group
- **AND** the project selector footer stays visible below the panel

#### Scenario: Specs panel header shows count and sort control
- **WHEN** the Specs panel renders for a project with 42 capability specs
- **THEN** the header shows the Specs title and the count `42`
- **AND** the header includes a sort control with `Name` and `Date` options, defaulting to `Name`

#### Scenario: Specs panel shows an empty state
- **WHEN** the Specs panel renders for a project with no capability specs
- **THEN** the panel shows `No specs found` in its list area

### Requirement: Specs panel shows nested specs as a folder tree
The Specs panel SHALL build a tree from the `/`-separated segments of each capability id. Each segment that has descendants SHALL render as a collapsible folder node, and a row SHALL show only its own segment, indented by depth. A capability whose id is a prefix of other capabilities SHALL render as one node that both opens its spec and expands its children.

#### Scenario: Nested ids render as folders
- **WHEN** the project has the specs `billing/invoice`, `network/auth`, and `network/auth/token`
- **THEN** the panel shows top-level folder rows `billing` and `network`
- **AND** expanding `network` shows a row `auth` one level deeper
- **AND** each row shows only its own segment, with the full capability id available as its tooltip

#### Scenario: A spec that also has children renders as one node
- **WHEN** the project has the specs `network` and `network/auth`
- **THEN** the panel shows one `network` row with an expand control
- **AND** activating the row label opens the `network` spec
- **AND** activating the expand control shows or hides `auth` without opening a spec

#### Scenario: Flat projects look like a plain list
- **WHEN** no capability id in the project contains `/`
- **THEN** the panel shows every spec as a top-level row with no folder rows and no indentation

### Requirement: Specs tree sorts siblings within each folder
The Specs panel SHALL apply the selected sort to siblings within each folder, never across folders. In `Name` order, folder nodes SHALL come before plain spec nodes and each group SHALL be alphabetical. In `Date` order, siblings SHALL be ordered newest first, where a folder's date is the newest `lastModified` among the specs it contains.

#### Scenario: Name order lists folders first
- **WHEN** the top level holds the folder `storage`, the folder `billing`, and the spec `architecture-overview`
- **AND** `Name` order is selected
- **THEN** the top level lists `billing`, `storage`, then `architecture-overview`

#### Scenario: Date order keeps categories together
- **WHEN** `Date` order is selected
- **AND** the newest spec in the project is `network/auth/token`
- **THEN** the `network` folder is listed first at the top level
- **AND** the specs inside each folder are ordered newest first without leaving their folder

### Requirement: Specs tree remembers folder expansion per project
The Specs panel SHALL start with every folder collapsed and SHALL remember which folders the operator expanded or collapsed, separately for each project, across reloads. Expansion entries for folders that no longer exist SHALL be ignored.

#### Scenario: Expanded folders survive a reload
- **WHEN** the operator expands `network` and `network/auth` and reloads the page
- **THEN** the Specs panel shows `network` and `network/auth` still expanded

#### Scenario: Expansion state is kept per project
- **WHEN** the operator expands `billing` in one project and switches to another project that also has a `billing` folder
- **THEN** the other project's `billing` folder keeps its own expansion state

### Requirement: Specs tree reveals the active spec
While the Specs panel is visible and the active Main Viewer tab is a spec, the panel SHALL expand that spec's ancestor folders, mark the spec row as active, and scroll the row into view. Revealing SHALL add the ancestors to the remembered expansion state and SHALL NOT collapse any other folder.

#### Scenario: Opening the Specs panel reveals the active spec
- **WHEN** the active tab shows the spec `network/auth/token`
- **AND** the operator opens the Specs panel with every folder collapsed
- **THEN** the `network` and `network/auth` folders are expanded
- **AND** the `token` row is shown as active and scrolled into view

### Requirement: Specs tree folder rows summarize their contents
A folder row that is not itself a spec SHALL show the number of specs it contains at any depth and the most severe inline validation attention state among those specs, using the same `failed`, `warning`, and `info` icons and the same hide rules as spec rows. Activating it SHALL toggle it. A row that is both a spec and a folder SHALL show its own spec's details like any other spec row.

#### Scenario: Folder row shows its spec count
- **WHEN** the `network/auth` folder contains three specs and `network` contains two more outside `network/auth`
- **THEN** the `network/auth` row shows `3`
- **AND** the `network` row shows `5`

#### Scenario: Folder row surfaces a failing descendant
- **WHEN** one spec under `billing` has the validation status `failed` and the others have `passed`
- **THEN** the `billing` folder row shows the shared `failed` icon
- **AND** a folder whose specs are all `passed`, `not-run`, `stale`, or `unknown` shows no validation icon

#### Scenario: A spec that also has children shows its own details
- **WHEN** `network` is a spec and also contains `network/auth`
- **THEN** the `network` row shows the `network` spec's datetime and its own validation icon
- **AND** it shows no folder count or folder validation summary

#### Scenario: Activating a plain folder toggles it
- **WHEN** the operator activates the `storage` folder row, which is not itself a spec
- **THEN** the folder expands or collapses
- **AND** no tab is opened

### Requirement: Specs tree spec rows keep spec item behavior
Spec rows in the Specs panel SHALL behave like the former Explorer spec items: they open preview or confirmed tabs with the same rules, offer the same context menu using the full capability id, show the last modification datetime on the second line, and show the trailing validation icon only for `failed`, `warning`, or `info`.

#### Scenario: Spec row opens the spec by full id
- **WHEN** the operator clicks the `token` row under `network/auth`
- **THEN** a tab for the spec `network/auth/token` is opened or focused with the existing preview-tab rules

#### Scenario: Spec row context menu uses the full id
- **WHEN** the operator chooses Search Related Changes from the `token` row's context menu
- **THEN** the Search panel opens with the query `network/auth/token`

### Requirement: Specs tree supports keyboard navigation
The Specs panel tree SHALL be operable from the keyboard. Arrow keys SHALL move between visible rows, Right SHALL expand a collapsed folder or move to its first child, Left SHALL collapse an expanded folder or move to its parent, and Enter SHALL open a spec row or toggle a plain folder row. The tree SHALL expose tree, row level, and expanded state to assistive technology.

#### Scenario: Arrow keys expand and collapse folders
- **WHEN** a collapsed folder row has keyboard focus and the operator presses Right
- **THEN** the folder expands
- **AND** pressing Left on the expanded folder collapses it

#### Scenario: Tree semantics are exposed
- **WHEN** assistive technology reads the Specs panel tree
- **THEN** the tree is announced as a tree
- **AND** each row reports its level, and each folder reports whether it is expanded
