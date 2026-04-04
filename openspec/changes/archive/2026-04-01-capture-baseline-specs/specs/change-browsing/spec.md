## ADDED Requirements

### Requirement: List active and archived changes
The system SHALL list active changes alphabetically, SHALL list archived changes newest-first by leading archive date when available, and SHALL expose per-change summary data including task progress, spec delta count, design presence, file counts, and archive status.

#### Scenario: Show active change summaries
- **WHEN** the workspace contains active changes
- **THEN** the system lists them alphabetically
- **AND** each summary includes task progress and spec delta count
- **AND** the UI marks changes with design content using a design badge

#### Scenario: Show archived change summaries
- **WHEN** the workspace contains archived changes stored with `YYYY-MM-DD-` prefixes
- **THEN** the system extracts the archive date from the folder name
- **AND** sorts archived entries newest-first
- **AND** the UI displays them as completed archived items

### Requirement: Render grouped change artifacts
The system SHALL recursively discover markdown and HTML files inside each change directory except the `specs/` subtree, SHALL expose top-level `proposal`, `tasks`, and `design` files as core groups in that order, SHALL group other files by folder, and SHALL expose spec delta files as a dedicated `Spec Deltas` tab when present.

#### Scenario: Render core change files first
- **WHEN** a change contains top-level `proposal.md`, `tasks.md`, and `design.md`
- **THEN** the detail view shows `Proposal`, `Tasks`, and `Design` tabs before non-core groups

#### Scenario: Group supplemental files by folder
- **WHEN** a change contains additional markdown or HTML files in subfolders
- **THEN** the system groups them by folder name
- **AND** sorts files alphabetically within each group
- **AND** groups root-level extras that are not core files under `Other`

#### Scenario: Show spec deltas separately
- **WHEN** a change contains capability deltas under `changes/<name>/specs/`
- **THEN** the detail view shows a `Spec Deltas` tab
- **AND** renders each capability delta independently from the other change files

### Requirement: Render markdown and HTML change artifacts safely
The system SHALL render markdown artifacts inline, SHALL render HTML artifacts in a sandboxed iframe with a direct-link option, and SHALL reject raw artifact requests that attempt to escape the selected change directory.

#### Scenario: Preview an HTML artifact
- **WHEN** the operator opens an HTML artifact in a change
- **THEN** the detail view displays it in a sandboxed iframe
- **AND** provides a link to open the same artifact in a new tab

#### Scenario: Reject an escaping raw file request
- **WHEN** a raw change file request contains `..` path segments or an absolute path
- **THEN** the system rejects the request as invalid

#### Scenario: Reject an unknown change artifact
- **WHEN** the operator requests a file that is not part of the selected change
- **THEN** the system returns a not-found response
