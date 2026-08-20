# tool-compatibility-reference Specification

## Purpose
Provides a source-aware reference for OpenSpec's official tool definitions and a non-exhaustive Shared Agent Skills research snapshot without conflating installation, path discovery reports, or product support.

## Requirements

### Requirement: Open an independent tool compatibility reference dialog
The Settings Tools section SHALL provide a read-only control that opens an independent tool-definition and Shared Agent Skills reference dialog. Opening or closing the dialog SHALL NOT replace the Settings tab, alter the active repository, refresh detected integrations, or change the existing detected-integration list. The reference SHALL remain available when no project is active because its contents describe tool definitions rather than active-repository evidence.

The dialog SHALL expose an accessible name, trap focus while open, close through an explicit control and the standard keyboard dismissal action, and restore focus to its opener when closed.

#### Scenario: Open the reference from Tools
- **WHEN** the operator activates the tool-reference control in Settings Tools
- **THEN** the independent reference dialog opens over the current Settings view
- **AND** the existing detected-integration list remains unchanged behind it

#### Scenario: Open without an active project
- **WHEN** no project is active and the operator opens the tool reference
- **THEN** the official definitions and compatibility reference remain available
- **AND** the dialog does not claim that any integration is configured for a repository

#### Scenario: Close accessibly
- **WHEN** the operator closes the dialog with its close control or keyboard dismissal action
- **THEN** the dialog closes without replacing Settings
- **AND** focus returns to the control that opened it

### Requirement: Visualize the complete OpenSpec tool definition set
The dialog SHALL present every tool in the WebUI's copied OpenSpec supported-tool definition set. Each definition SHALL identify the OpenSpec tool id, display name, available Commands and Skills delivery, configured Commands path when present, configured Skills path when present, and documented invocation form when present. The official definition view SHALL expose the upstream OpenSpec documentation link and the OpenSpec release or definition version against which the local table was verified.

The official definition view SHALL be searchable by display name, tool id, and configured path. Missing Commands, Skills, or invocation data SHALL be represented explicitly rather than by inventing a value. OpenSpec's official definition data SHALL remain visually and semantically separate from independently researched Shared Agent Skills compatibility.

#### Scenario: Show a complete official definition
- **WHEN** the operator views an OpenSpec-supported tool with both Commands and Skills
- **THEN** the row shows its tool id, both delivery paths, and both documented invocation forms
- **AND** identifies the table as copied from OpenSpec definitions

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
The dialog SHALL present a separate, non-exhaustive research view describing reported ways AI clients access `.agents/skills`. Each displayed record SHALL identify the client, its reported Agent Skills access mode, applicable project or global scope, evidence kind, evidence source or reference, research date, and a version constraint when one is known. Access mode SHALL be one of project-native discovery, global-only discovery, configurable path, import or symlink workflow, Agent Skills format-only evidence, or unverified/conflicting research.

Agent Skills format support SHALL NOT be displayed as proof that the client automatically discovers repository-local `.agents/skills`. The compatibility view SHALL include only clients for which useful research has been collected, SHALL allow clients without an OpenSpec tool id, and SHALL state that absence from the list is no conclusion about compatibility.

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

### Requirement: Explain the shared `.agents/skills` relationship
The compatibility view SHALL identify `.agents/skills` as a shared repository path that OpenSpec can generate through the `agents`, `codex`, and `zed` targets. It SHALL distinguish their invocation contracts: `agents` and `zed` render slash-style `/openspec-*` references, while Codex requires the explicit `codex` target and `$openspec-*` references. It SHALL explain that a Codex-led tree can also serve slash-style clients, while selecting only `agents` does not constitute a Codex setup merely because the physical path is the same.

The compact target summary SHALL NOT repeat a list of researched or confirmed clients because the searchable rows below provide that information. Those rows SHALL distinguish other access modes and describe them as sourced research findings. The presentation SHALL NOT claim that the WebUI maintainers tested every client, that an executable is installed or configured, or that every OpenSpec workflow was validated.

The initial project-path candidate dataset SHALL include at least OpenCode, Codex, Cursor, Zed, Antigravity, Grok Build, Gemini CLI, GitHub Copilot, Kimi Code CLI, Qwen Code, Kilo Code, and Pi. Those records SHALL retain their research provenance independently of OpenSpec's official definition table.

#### Scenario: Show target-specific invocation contracts
- **WHEN** the operator views the Shared Agent Skills summary
- **THEN** it shows that `agents` and `zed` render slash-style references into `.agents/skills`
- **AND** separately shows that `codex` renders dollar-style references into the same physical path

#### Scenario: Explain the Codex target rule
- **WHEN** the operator intends to use Codex together with other `.agents/skills` clients
- **THEN** the dialog says to select the `codex` OpenSpec target explicitly
- **AND** explains that the Codex-led tree can serve slash-style clients but an `agents`-only tree is not a Codex setup

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
