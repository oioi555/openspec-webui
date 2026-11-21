# tool-compatibility-reference Specification

## Purpose
Provides a source-aware reference for OpenSpec's official tool definitions and a non-exhaustive Shared Agent Skills research snapshot without conflating installation, path discovery reports, or product support.

## Requirements

### Requirement: Open an independent tool compatibility reference dialog
The Settings Tools section SHALL provide a read-only control that opens an independent tool-definition and Shared Agent Skills reference dialog. Opening or closing it SHALL NOT replace the Settings tab, alter the active repository, or refresh or change the detected-integration list. The reference SHALL remain available when no project is active. The dialog SHALL have an accessible name, trap focus while open, close by an explicit control or keyboard dismissal, and restore focus to its opener.

#### Scenario: Open the reference from Tools
- **WHEN** the operator activates the tool-reference control in Settings Tools
- **THEN** the independent reference dialog opens over the current Settings view
- **AND** the existing detected-integration list remains unchanged behind it
- **AND** the Settings tab is not replaced, the active repository is not altered, and detected integrations are not refreshed

#### Scenario: Dialog is accessible while open
- **WHEN** the reference dialog is open
- **THEN** it exposes an accessible name
- **AND** traps keyboard focus inside the dialog

#### Scenario: Open without an active project
- **WHEN** no project is active and the operator opens the tool reference
- **THEN** the official definitions and compatibility reference remain available
- **AND** the dialog does not claim that any integration is configured for a repository

#### Scenario: Close accessibly
- **WHEN** the operator closes the dialog with its close control or keyboard dismissal action
- **THEN** the dialog closes without replacing Settings
- **AND** focus returns to the control that opened it

### Requirement: Visualize the complete OpenSpec tool definition set
The dialog SHALL present every tool in the WebUI's copied OpenSpec supported-tool definition set with its tool id, display name, Commands and Skills delivery, and configured paths and invocation form when present; missing data SHALL be shown explicitly, not invented. The official view SHALL show the upstream documentation link and verified OpenSpec version, SHALL be searchable by display name, tool id, and path, and SHALL stay separate from Shared Agent Skills research.

#### Scenario: Show a complete official definition
- **WHEN** the operator views an OpenSpec-supported tool with both Commands and Skills
- **THEN** the row shows its tool id, both delivery paths, and both documented invocation forms
- **AND** identifies the table as copied from OpenSpec definitions
- **AND** shows the tool's display name

#### Scenario: Show a skills-only definition
- **WHEN** an OpenSpec-supported tool has Skills but no Commands adapter
- **THEN** the row shows its Skills path and invocation information
- **AND** explicitly shows that Commands are not defined

#### Scenario: Search official definitions
- **WHEN** the operator searches using a tool name, tool id, or path fragment
- **THEN** the official definition view shows only matching definitions
- **AND** clearing the search restores the complete set

#### Scenario: Show official source provenance
- **WHEN** the official definition view is visible
- **THEN** it shows the OpenSpec source version and a link to the official supported-tools documentation
- **AND** does not describe independently researched compatibility as OpenSpec support

### Requirement: Model Shared Agent Skills compatibility independently
The dialog SHALL present a separate, non-exhaustive research view of reported ways AI clients access `.agents/skills`, each record giving client, access mode, scope, evidence kind, source, research date, and known version constraint. Agent Skills format support SHALL NOT be shown as proof of automatic `.agents/skills` discovery. The view SHALL include only usefully researched clients, SHALL allow clients without an OpenSpec tool id, and SHALL state that absence is no conclusion.

#### Scenario: Distinguish native discovery from format support
- **WHEN** one client natively discovers repository-local `.agents/skills` and another is known only to support the Agent Skills format
- **THEN** the first is labeled project-native
- **AND** the second is labeled format-only rather than automatically compatible

#### Scenario: Show configuration and import requirements
- **WHEN** a client requires a configured path or an import/symlink operation
- **THEN** the compatibility view labels the corresponding access mode
- **AND** does not present that client as automatically discovering the project path

#### Scenario: Omit an unresearched tool without drawing a conclusion
- **WHEN** no useful `.agents/skills` research has been collected for an OpenSpec-supported tool
- **THEN** the compatibility view is not required to contain a placeholder row for that tool
- **AND** the view explains that omission does not mean the tool is incompatible

#### Scenario: Include a tool outside OpenSpec support
- **WHEN** compatibility research exists for a client without an OpenSpec tool id
- **THEN** the compatibility view includes that client
- **AND** clearly indicates that it is not an OpenSpec-supported setup target

#### Scenario: Expose evidence provenance
- **WHEN** the operator inspects a compatibility record
- **THEN** the dialog exposes whether the evidence came from vendor documentation, an ecosystem listing, a research summary, or observed runtime behavior
- **AND** exposes its source or reference and research date
- **AND** exposes the record's project or global scope and a version constraint when one is known

#### Scenario: Access mode uses a fixed vocabulary
- **WHEN** a compatibility record is displayed
- **THEN** its access mode is one of project-native discovery, global-only discovery, configurable path, import or symlink workflow, Agent Skills format-only evidence, or unverified/conflicting research

### Requirement: Explain the shared `.agents/skills` relationship
The compatibility view SHALL identify `.agents/skills` as a shared repository path OpenSpec can generate through any pinned official tool whose skills install there. The compact target summary SHALL list every such tool grouped by invocation contract, slash-style `/openspec-*` versus Codex `$openspec-*`, SHALL explain that installing through any of them lets the `.agents`-compatible clients listed below use the skills, and SHALL NOT present command or workflow paths or a legacy `.agent` row.

#### Scenario: Show target-specific invocation contracts
- **WHEN** the operator views the Shared Agent Skills summary
- **THEN** the compact summary lists every pinned official tool whose skills install into `.agents/skills`, grouped by invocation style
- **AND** slash-style installers share one `/openspec-*` row on `.agents/skills`
- **AND** separately shows that `codex` renders dollar-style `$openspec-*` references into the same physical skills path
- **AND** the compact summary does not show command or workflow paths or a legacy `.agent` row

#### Scenario: Group official shared-path skill installers
- **WHEN** the pinned official catalog includes tools whose skills path is under `.agents/skills`
- **THEN** the compact shared-target summary includes those tools as installers of the shared skills path
- **AND** slash-style tools such as `agents`, `amp`, `antigravity`, `gsd`, and `zed` appear together when the pin records their skills there

#### Scenario: Explain that one installer unlocks shared clients
- **WHEN** the operator views the Shared Agent Skills compact target summary
- **THEN** the summary explains that installing skills through any of those official targets writes them into shared `.agents/skills`
- **AND** that the `.agents`-compatible clients in the research list below can then use them
- **AND** that this applies to a main tool target, not only the generic `agents` target

#### Scenario: Present Codex as the non-slash exception
- **WHEN** the operator views the compact shared-target summary
- **THEN** Codex appears in its own dollar-style row on `.agents/skills`
- **AND** the summary explains that Codex cannot invoke skills with `/`

#### Scenario: Explain the Codex target rule
- **WHEN** the operator intends to use Codex together with other `.agents/skills` clients
- **THEN** the dialog says to select the `codex` OpenSpec target explicitly
- **AND** explains that the Codex-led tree can serve slash-style clients but an `agents`-only tree is not a Codex setup

#### Scenario: Explain current and legacy Antigravity roots
- **WHEN** the operator inspects the Antigravity definition or shared-root explanation
- **THEN** the official definition view shows the pinned snapshot paths for that tool
- **AND** when that pin places Antigravity skills under `.agents/skills`, the compact shared-target summary includes Antigravity among the slash-style installers
- **AND** the compact summary does not show Antigravity workflows or a legacy `.agent` row

#### Scenario: Avoid duplicating compatibility rows in the summary
- **WHEN** the shared target summary is displayed
- **THEN** it does not enumerate confirmed or researched clients
- **AND** the operator can inspect those clients in the searchable rows below

#### Scenario: Include the initial project-path candidate set
- **WHEN** the initial compatibility dataset is loaded
- **THEN** the named initial candidates are listed with their reported `.agents/skills` access mode
- **AND** each finding has source and research-date metadata

#### Scenario: Avoid installed-tool claims
- **WHEN** a client is listed as project-native
- **THEN** the dialog describes path-discovery compatibility
- **AND** does not state that the client executable is installed or currently configured

### Requirement: Present large reference sets responsively
The dialog SHALL remain usable with the full supported-tool set on desktop and mobile. It SHALL provide distinct official-definition and Shared Agent Skills compatibility views, preserve source and classification context while filtering, and prevent long paths or invocation text from making dialog controls inaccessible. The reference SHALL provide textual labels in addition to color for every compatibility mode.

#### Scenario: Browse the complete set on desktop
- **WHEN** the dialog is opened at desktop width
- **THEN** the operator can search, switch reference views, inspect complete rows, and reach source links without leaving the dialog

#### Scenario: Browse on a narrow viewport
- **WHEN** the dialog is opened on a narrow viewport
- **THEN** definition and compatibility details remain readable through a responsive row or card presentation
- **AND** close, search, view-switching, and source controls remain reachable

#### Scenario: Keep clear of the persistent Activity Bar
- **WHEN** the dialog is open while the browser is resized to an intermediate or narrow width
- **THEN** the dialog and its overlay remain within the application content viewport to the right of the Activity Bar
- **AND** the Activity Bar does not cover the dialog content

#### Scenario: Understand modes without color
- **WHEN** compatibility records are displayed
- **THEN** every access mode has a textual label
- **AND** color is not the sole means of distinguishing compatibility classifications

### Requirement: Keep the reference read-only and isolated from detection
The dialog SHALL NOT install tools, execute `openspec init`, write repository files, infer installed executables, or alter command-shortcut eligibility. Official definitions and independently researched compatibility SHALL be reference data only; current-project command candidates SHALL continue to depend exclusively on repository-local artifact evidence.

#### Scenario: Viewing reference data does not change candidates
- **WHEN** the operator opens, filters, and closes the dialog
- **THEN** command-shortcut candidates remain unchanged
- **AND** no repository detection refresh is triggered

#### Scenario: Reference data does not imply project evidence
- **WHEN** a tool appears in either reference view but has no artifacts in the active repository
- **THEN** the dialog may describe its definitions or compatibility
- **AND** existing Settings detection and command shortcuts do not report it as configured

### Requirement: Show 2.x delivery and scope support in the reference
When the pinned official snapshot comes from OpenSpec `v2.0.0` or later, the official definition view SHALL state once that OpenSpec retired command files in 2.0 and SHALL NOT mark each row as missing Commands. Each row SHALL show the tool's skill scope support: reads the universal folder, uses its own global folder (with the folder), or project install only.

#### Scenario: View the 2.1.1 definitions
- **WHEN** the operator opens the compatibility reference with the v2.1.1 snapshot
- **THEN** the view shows a single note that Commands were retired in 2.0
- **AND** the Claude Code row shows its own global folder, and the `eve` row shows project install only

### Requirement: Serve tool display names to the client
Tool display names and skill scope support used anywhere in the client SHALL come from the tool-reference data served by the server. The client SHALL NOT keep its own copy of those tables. An id missing from the served data SHALL be shown as the id itself.

#### Scenario: Shared marker lists a tool
- **WHEN** a shared `.agents` marker lists `kimi`
- **THEN** the candidate label uses the served display name `Kimi Code`

### Requirement: Keep the Shared Agent Skills summary free of client claims
The compact target summary SHALL NOT repeat a list of researched or confirmed clients, because the searchable rows below provide it. Those rows SHALL distinguish other access modes and describe them as sourced research findings. The presentation SHALL NOT claim that the WebUI maintainers tested every client, that an executable is installed or configured, or that every OpenSpec workflow was validated.

#### Scenario: Research rows are described as sourced findings
- **WHEN** the operator views the searchable compatibility rows
- **THEN** each access mode is described as a sourced research finding
- **AND** the summary above does not repeat the client list

#### Scenario: No testing or validation claims
- **WHEN** the Shared Agent Skills presentation is displayed
- **THEN** it does not claim that the WebUI maintainers tested every client
- **AND** does not claim that any client executable is installed or configured
- **AND** does not claim that every OpenSpec workflow was validated

### Requirement: Seed the initial `.agents/skills` candidate dataset
The initial project-path candidate dataset SHALL include at least OpenCode, Codex, Cursor, Zed, Antigravity, Grok Build, Gemini CLI, GitHub Copilot, Kimi Code CLI, Qwen Code, Kilo Code, and Pi. Those records SHALL retain their research provenance independently of OpenSpec's official definition table.

#### Scenario: Initial candidates are present
- **WHEN** the initial compatibility dataset is loaded
- **THEN** it contains records for OpenCode, Codex, Cursor, Zed, Antigravity, Grok Build, Gemini CLI, GitHub Copilot, Kimi Code CLI, Qwen Code, Kilo Code, and Pi

#### Scenario: Candidate provenance is independent of official definitions
- **WHEN** an initial candidate record is inspected
- **THEN** its research provenance is shown from the compatibility dataset
- **AND** it does not depend on OpenSpec's official definition table
