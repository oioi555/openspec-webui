# Spec Delta

## MODIFIED Requirements

### Requirement: Links to change files open the Change tab at that file
The system SHALL open the Change tab of an active or archived change when a link target is inside that change's directory and the ChangeViewer can show it, and SHALL select the linked file. The ChangeViewer can show the change directory itself, files at the change root, Markdown files in subfolders other than `specs/`, and delta spec files under `specs/`. Any other target inside a change directory SHALL be handled as a local file.

#### Scenario: Link to another change's design
- **WHEN** the user clicks a link that resolves to `design.md` of change `add-auth`
- **THEN** the Change tab for `add-auth` opens with its design file selected

#### Scenario: Link to a file of the same change
- **GIVEN** the Change tab for `add-auth` shows its proposal
- **WHEN** the user clicks a link to `tasks.md` of the same change
- **THEN** the same tab switches to the tasks file without opening another tab

#### Scenario: Link to a delta spec or other file of a change
- **WHEN** the user clicks a link that resolves to a delta spec or to an other file of a change
- **THEN** the Change tab opens with that delta spec or other file shown and expanded

#### Scenario: Link to a change directory
- **WHEN** the user clicks a link that resolves to the directory of an archived change
- **THEN** the Change tab for that archived change opens

#### Scenario: Link to an evidence file in a change subfolder
- **WHEN** the user clicks a link that resolves to `evidence/pytest-full.txt` inside change `add-auth`
- **THEN** the link is handled as a local file through the "Open files with" preference
- **AND** no Change tab is opened

## ADDED Requirements

### Requirement: Local file links carry line numbers from common formats
The system SHALL read the line number of a local file link from a `:<n>` path suffix or from a `#L<n>`, `#<n>`, `#<n>-<m>`, `#L<n>-<m>`, or `#L<n>-L<m>` fragment. A range SHALL use its start line.

#### Scenario: Line range fragment from a file URL
- **GIVEN** the "Open files with" preference is Zed
- **WHEN** the user clicks a link to `file:///repo/src/jobs.py#849-851`
- **THEN** the browser opens `zed://file/repo/src/jobs.py:849`

#### Scenario: Bare line fragment
- **GIVEN** the "Open files with" preference is VS Code
- **WHEN** the user clicks a link to `../../src/server/index.ts#42`
- **THEN** the browser opens `vscode://file/<root>/src/server/index.ts:42`

### Requirement: Local file link targets are checked for existence
The system SHALL check whether each local file link target inside the active project's root or its OpenSpec root exists, and SHALL mark a link whose target does not exist as missing with a visible indicator and a "File not found" tooltip. Targets outside those roots SHALL NOT be checked and SHALL be shown unmarked.

#### Scenario: Missing target is flagged
- **GIVEN** a change document links to `../../../docs/old-notes.md`
- **WHEN** that file does not exist in the project
- **THEN** the link is shown as missing with a "File not found" tooltip

#### Scenario: Existing target is not flagged
- **WHEN** a link resolves to `<root>/src/server/index.ts` and the file exists
- **THEN** the link is shown as a normal link

#### Scenario: Target outside the project is not checked
- **WHEN** a link resolves to `/etc/hosts`
- **THEN** no existence check is made for it and the link is shown unmarked

### Requirement: Missing local file links do not open an editor
The system SHALL NOT open an editor for a link whose target is marked missing. A click SHALL copy the absolute path to the clipboard and show a warning that the file was not found, whatever the "Open files with" preference is.

#### Scenario: Click a missing link with an editor preference
- **GIVEN** the "Open files with" preference is Zed
- **WHEN** the user clicks a link whose target is marked missing
- **THEN** no editor URL is opened
- **AND** the path is copied and a "file not found" warning is shown

### Requirement: Archived change links fall back to the pre-archive location
For a document inside an archived change, the system SHALL resolve a relative link a second time against the change's pre-archive directory (`openspec/changes/<name>/`, where `<name>` is the archived directory name without its `YYYY-MM-DD-` prefix) when the first target is neither a known spec or change nor an existing file. The system SHALL use the second target only when it is a known spec or change or an existing file.

#### Scenario: Docs link written before archiving
- **GIVEN** archived change `2026-01-15-add-line` contains `proposal.md` with the link `../../../docs/design.md`
- **AND** `<root>/docs/design.md` exists
- **WHEN** the proposal is rendered
- **THEN** the link targets `<root>/docs/design.md`

#### Scenario: Spec link written before archiving
- **GIVEN** an archived change document links to `../../specs/auth/spec.md`
- **WHEN** the user clicks the link
- **THEN** the Spec tab for `auth` opens

#### Scenario: Link already written for the archived location
- **GIVEN** an archived change document links to `../../../../docs/design.md`
- **AND** that target exists
- **THEN** the link keeps its first target and no fallback is applied

### Requirement: Path existence checks are limited to the project
The server SHALL answer path existence requests only for absolute paths inside the active project's root or its OpenSpec root, after normalizing `.` and `..` segments. It SHALL report every other path as unknown, SHALL return only whether each path exists, and SHALL reject a request with more than 200 paths.

#### Scenario: Path outside the project
- **WHEN** the client asks about `/etc/passwd`
- **THEN** the server reports it as unknown without checking the filesystem

#### Scenario: Path escaping with dot segments
- **WHEN** the client asks about `<root>/docs/../../etc/passwd`
- **THEN** the server reports it as unknown

#### Scenario: Too many paths
- **WHEN** the client sends 201 paths in one request
- **THEN** the server rejects the request with a 400 error
