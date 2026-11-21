## MODIFIED Requirements

### Requirement: Discover change other files
The system SHALL discover non-standard files that belong directly to a change directory (`openspec/changes/<changeId>/`) and expose them as Other Files. The discovery SHALL exclude `proposal.md`, `design.md`, `tasks.md`, and spec delta documents under `specs/**/spec.md`, and SHALL include scaffold and custom text files. The system SHALL NOT read MCP review or approval records from `openspec/reviews/**` or `openspec/approvals/**` as Other Files.

#### Scenario: Discover revisions json in change directory
- **WHEN** a change directory contains `revisions.json`
- **THEN** the change data exposes `revisions.json` as an Other File
- **AND** the file remains separate from proposal, design, tasks, and spec delta content

#### Scenario: Discover scaffold and custom text files
- **WHEN** a change directory contains `.openspec.yaml`, Markdown notes, JSON, YAML/YML, TXT, or other text-like files
- **THEN** the change data exposes each of them as an Other File

#### Scenario: Exclude standard change artifacts
- **WHEN** a change directory contains `proposal.md`, `design.md`, `tasks.md`, and `specs/example/spec.md`
- **THEN** those files are not counted or listed as Other Files

#### Scenario: Ignore MCP review storage
- **WHEN** `openspec/reviews/changes/<changeId>/proposal.json` exists for a change
- **THEN** that review file is not exposed as an Other File for the change
- **AND** approval records under `openspec/approvals/**` are not exposed as Other Files either

### Requirement: Render other files in ChangeViewer
The system SHALL render discovered Other Files in the ChangeViewer under a dedicated top-level `Other` primary tab, alongside the Proposal, Design, Tasks, and Spec Deltas tabs, with a badge count of discovered Other Files. Within the tab, files SHALL render as collapsible sections formatted by file type, falling back to raw text rather than hiding a file that cannot be parsed. Other Files SHALL NOT be appended beneath Proposal, Design, Tasks, or Spec Deltas content.

#### Scenario: Render multiple other files as collapsible sections
- **WHEN** a change has `.openspec.yaml`, `revisions.json`, and `notes.md`
- **THEN** the ChangeViewer shows an `Other` primary tab with a badge count of `3`
- **AND** selecting the `Other` tab shows one collapsible section for each file
- **AND** each section label uses the file path or file name
- **AND** the sections are collapsible like spec delta sections

#### Scenario: Other files are not shown inside spec deltas
- **WHEN** a change has both spec deltas and Other Files
- **THEN** selecting the Spec Deltas tab shows only spec delta content
- **AND** Other Files are not appended beneath Proposal, Design, or Tasks content either
- **AND** selecting the `Other` tab shows the Other Files content

#### Scenario: Render JSON readably
- **WHEN** an Other File contains valid JSON
- **THEN** the ChangeViewer displays it in pretty-printed readable form

#### Scenario: Render Markdown other file
- **WHEN** an Other File is a Markdown file
- **THEN** the ChangeViewer renders it as Markdown content

#### Scenario: Render revisions json as revision cards
- **WHEN** an Other File is named `revisions.json` and contains a valid OpenSpec MCP revisions payload
- **THEN** the ChangeViewer displays the change id, revision count, revision id, type, author, timestamp, description, reason, update targets, and source metadata as structured revision cards
- **AND** the raw JSON fallback is not used for that valid revisions payload

#### Scenario: Fall back when specialized parsing fails
- **WHEN** an Other File cannot be parsed for specialized formatting
- **THEN** the ChangeViewer displays its raw text instead of hiding the file

#### Scenario: Fall back for unknown text file
- **WHEN** an Other File is YAML/YML, TXT, or has an unknown text-like extension
- **THEN** the ChangeViewer displays its raw text in a preformatted block
