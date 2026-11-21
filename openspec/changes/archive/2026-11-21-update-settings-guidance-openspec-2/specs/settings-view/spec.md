## ADDED Requirements

### Requirement: Tools section groups machine and repository skills
The Settings Tools section SHALL list global integrations under a "This machine" group, explained as shared by every project on this machine, and project integrations under a "This repository" group, explained as kept for team sharing, tools without a global folder, or the GitHub Copilot cloud agent. The repository group SHALL show whether `openspec/config.yaml` records `skillsScope: project`. An empty group SHALL show a one-line empty state; the warning SHALL appear only when both are empty.

#### Scenario: Global-only repository
- **WHEN** the active project has only global evidence
- **THEN** the machine group lists those tools and the repository group shows its empty state
- **AND** no zero-detection warning is shown

#### Scenario: Team-shared repository
- **WHEN** the active project has project evidence and `skillsScope: project`
- **THEN** the repository group lists those tools and states that the repository keeps its own skills

### Requirement: Tools section offers commands for the current state
The Tools section SHALL offer copyable commands that match the detected state:
- `openspec init --tools <id>` to add a tool, labelled for this machine, or for the repository when it has project skills;
- `openspec init --scope project` to keep skills in the repository;
- `openspec init` when nothing is detected.

Command tokens SHALL stay in English.

#### Scenario: Add a tool to a project-scope repository
- **WHEN** the repository has project-scope skills, with or without `skillsScope: project` recorded
- **THEN** the add-tool command is labelled as adding to this repository and its picker includes project-only tools

### Requirement: Tools section offers moving to machine-wide skills
The Tools section SHALL offer `openspec init --scope global` for a project-scope repository only when every configured tool supports global skills and no GitHub Copilot cloud agent files exist. Otherwise it SHALL show why the move is not available.

#### Scenario: Offer moving to machine-wide skills
- **WHEN** the repository has project-scope skills for Claude Code and Codex only
- **THEN** the section offers `openspec init --scope global`

#### Scenario: Project-only tool blocks the move
- **WHEN** the repository has project-scope skills for a tool recorded as project install only
- **THEN** the section does not offer `openspec init --scope global` and names that tool as the reason

### Requirement: Tools rows show scope support and legacy state
Each Tools row SHALL show the tool's skill scope support from the served tool reference. An integration whose only evidence is 1.x command files SHALL be labelled as 1.x legacy with an `openspec update` hint. A shared `.agents` integration with several marker targets SHALL be labelled with the display names of those targets.

#### Scenario: 1.x command-only integration
- **WHEN** a detected integration has Commands evidence and no Skills evidence
- **THEN** its row shows a 1.x legacy label and the `openspec update` hint

#### Scenario: Multi-target shared tree
- **WHEN** the shared `.agents` integration lists targets `codex`, `cursor`, and `kimi`
- **THEN** its label reads Shared `.agents` with Codex, Cursor, and Kimi Code

### Requirement: Settings documentation links target current OpenSpec docs
Every OpenSpec documentation link shown in Settings and the Add Project dialog SHALL point to a current page of the official OpenSpec documentation site. No link SHALL point to documentation of the retired `/opsx` command files. The links SHALL be defined in one shared module.

#### Scenario: Open the init reference
- **WHEN** the operator follows the init reference link in the Tools section
- **THEN** the official documentation page for `openspec init` opens
