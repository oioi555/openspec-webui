## ADDED Requirements

### Requirement: Discover change other files
The system SHALL discover non-standard files that belong directly to a change directory and expose them as Other Files. The discovery SHALL exclude `proposal.md`, `design.md`, `tasks.md`, and spec delta documents under `specs/**/spec.md`. The discovery SHALL include scaffold and custom text files such as `.openspec.yaml`, `revisions.json`, Markdown notes, JSON, YAML/YML, TXT, and other text-like files located inside `openspec/changes/<changeId>/`. The system SHALL NOT read MCP review or approval records from `openspec/reviews/**` or `openspec/approvals/**` as Other Files.

#### Scenario: Discover revisions json in change directory
- **WHEN** a change directory contains `revisions.json`
- **THEN** the change data exposes `revisions.json` as an Other File
- **AND** the file remains separate from proposal, design, tasks, and spec delta content

#### Scenario: Exclude standard change artifacts
- **WHEN** a change directory contains `proposal.md`, `design.md`, `tasks.md`, and `specs/example/spec.md`
- **THEN** those files are not counted or listed as Other Files

#### Scenario: Ignore MCP review storage
- **WHEN** `openspec/reviews/changes/<changeId>/proposal.json` exists for a change
- **THEN** that review file is not exposed as an Other File for the change

### Requirement: Render other files in ChangeViewer
The system SHALL render discovered Other Files in the ChangeViewer under a dedicated top-level `Other` primary tab. The `Other` tab SHALL appear alongside the existing Proposal, Design, Tasks, and Spec Deltas primary tabs, and SHALL show a badge count for the number of discovered Other Files. Within the `Other` tab, the system SHALL render files using collapsible file sections similar to spec delta sections. Markdown files SHALL render as Markdown content. `revisions.json` files SHALL render as a friendly revision list using the known OpenSpec MCP revision schema. Other JSON files SHALL render in a readable pretty-printed form. YAML/YML, TXT, and unknown text-like files SHALL render as preformatted text. If a file cannot be parsed for specialized formatting, the system SHALL fall back to raw text display rather than hiding the file. Other Files SHALL NOT be appended beneath Proposal, Design, Tasks, or Spec Deltas content.

#### Scenario: Render multiple other files as collapsible sections
- **WHEN** a change has `.openspec.yaml`, `revisions.json`, and `notes.md`
- **THEN** the ChangeViewer shows an `Other` primary tab with a badge count of `3`
- **AND** selecting the `Other` tab shows one collapsible section for each file
- **AND** each section label uses the file path or file name

#### Scenario: Other files are not shown inside spec deltas
- **WHEN** a change has both spec deltas and Other Files
- **THEN** selecting the Spec Deltas tab shows only spec delta content
- **AND** selecting the `Other` tab shows the Other Files content

#### Scenario: Render JSON readably
- **WHEN** an Other File contains valid JSON
- **THEN** the ChangeViewer displays it in pretty-printed readable form

#### Scenario: Render revisions json as revision cards
- **WHEN** an Other File is named `revisions.json` and contains a valid OpenSpec MCP revisions payload
- **THEN** the ChangeViewer displays the change id, revision count, revision id, type, author, timestamp, description, reason, update targets, and source metadata as structured revision cards
- **AND** the raw JSON fallback is not used for that valid revisions payload

#### Scenario: Fall back for unknown text file
- **WHEN** an Other File has an unknown text-like extension
- **THEN** the ChangeViewer displays its raw text in a preformatted block

### Requirement: Dashboard summarizes meaningful other files
The system SHALL show an `Other N` badge on dashboard change cards when a change has one or more meaningful Other Files. For dashboard badge counts, `.openspec.yaml` SHALL be excluded as default scaffold noise. When `.openspec.yaml` is the only Other File, the dashboard SHALL NOT show an Other badge. The Explorer Pane SHALL NOT show Other File badges or counts.

#### Scenario: Hide dashboard badge for only openspec yaml
- **WHEN** a change has `.openspec.yaml` and no other Other Files
- **THEN** dashboard change cards do not show an Other badge for that change

#### Scenario: Show dashboard badge for revisions json
- **WHEN** a change has `.openspec.yaml` and `revisions.json`
- **THEN** dashboard change cards show an `Other 1` badge for that change

#### Scenario: Explorer rows omit other count
- **WHEN** the Explorer Pane renders a change with meaningful Other Files
- **THEN** the Explorer row does not show an Other badge or Other file count
