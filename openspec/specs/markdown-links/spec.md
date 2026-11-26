# markdown-links Specification

## Purpose

Defines how links inside rendered Markdown content are resolved and opened, so that relative document links, heading anchors, external URLs, and links to local files all lead somewhere useful instead of breaking the WebUI route.

## Requirements

### Requirement: Relative links resolve against the source document
The system SHALL resolve each relative link in rendered Markdown against the absolute location of the document that contains it, not against the browser URL. Absolute filesystem paths in links SHALL be used as written.

#### Scenario: Relative link from a change proposal
- **GIVEN** the proposal of change `add-auth` at `<root>/openspec/changes/add-auth/proposal.md`
- **WHEN** it contains the link `../../specs/auth/spec.md`
- **THEN** the link target resolves to `<root>/openspec/specs/auth/spec.md`

#### Scenario: Relative link from a delta spec
- **GIVEN** the delta spec for capability `auth` inside change `add-auth`
- **WHEN** it contains the link `../../design.md`
- **THEN** the link target resolves to `<root>/openspec/changes/add-auth/design.md`

### Requirement: Links to specs open the Spec tab
The system SHALL open the Spec tab of a capability when a link target is that capability's `spec.md` or its capability directory.

#### Scenario: Link to a main spec file
- **WHEN** the user clicks a link that resolves to the `spec.md` of capability `auth`
- **THEN** the Spec tab for `auth` opens and becomes active
- **AND** the browser stays inside the WebUI

#### Scenario: Link to a nested capability directory
- **WHEN** the user clicks a link that resolves to the directory of nested capability `identity/user-auth`
- **THEN** the Spec tab for `identity/user-auth` opens

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

### Requirement: In-app links keep native browser link behavior
The system SHALL give in-app link targets an href that is the WebUI route of the target, so that opening the link in a new browser tab or copying the link address yields a working WebUI URL. A plain primary click SHALL navigate inside the current WebUI tab set.

#### Scenario: Open a spec link in a new browser tab
- **WHEN** the user middle-clicks or Ctrl/Cmd-clicks a link that resolves to spec `auth`
- **THEN** the browser opens the WebUI route for spec `auth` in a new browser tab

### Requirement: Same-document heading anchors scroll the viewer
The system SHALL give rendered headings stable slug ids and SHALL scroll the current viewer to the matching heading when the user clicks a link whose target is only a fragment (`#…`). Clicking such a link SHALL NOT change the WebUI route.

#### Scenario: Anchor to a requirement heading
- **GIVEN** a spec containing the heading `### Requirement: User login`
- **WHEN** the user clicks the link `#requirement-user-login` in the same document
- **THEN** the viewer scrolls the heading into view

#### Scenario: Anchor without a matching heading
- **WHEN** the user clicks a fragment link that matches no heading
- **THEN** nothing scrolls and the route does not change

### Requirement: External links open in a new browser tab
The system SHALL open links with an `http`, `https`, or `mailto` scheme in a new browser tab or the system handler, without replacing the WebUI.

#### Scenario: External documentation link
- **WHEN** the user clicks a link to `https://example.com/docs`
- **THEN** the page opens in a new browser tab
- **AND** the WebUI keeps its open tabs

### Requirement: Links to other local files use the open-files preference
The system SHALL handle a link that resolves to a local path that is not a known spec or change target according to the "Open files with" preference. With the copy option the system SHALL copy the absolute path to the clipboard and confirm it. With an editor option the system SHALL open the editor URL built from the absolute path and the line number, if the link has one.

#### Scenario: Copy path by default
- **GIVEN** the "Open files with" preference is left at its default
- **WHEN** the user clicks a link that resolves to `<root>/src/server/index.ts`
- **THEN** the absolute path is copied to the clipboard
- **AND** a confirmation is shown

#### Scenario: Open in VS Code with a line number
- **GIVEN** the preference is VS Code
- **WHEN** the user clicks a link to `../../src/server/index.ts#L42`
- **THEN** the browser opens `vscode://file/<root>/src/server/index.ts:42`

#### Scenario: Custom URL template
- **GIVEN** the preference is a custom template `myeditor://open?file={path}&line={line}`
- **WHEN** the user clicks a link to a local file without a line number
- **THEN** the browser opens the template with `{path}` replaced by the URL-encoded absolute path and `{line}` replaced by `1`

### Requirement: Unsafe link schemes are not followed
The system SHALL NOT navigate to links whose scheme is not one the system handles (for example `javascript:` or `data:`). It SHALL also reject a custom editor template that does not start with a URL scheme, or whose scheme is `javascript`, `data`, or `vbscript`.

#### Scenario: Script link in Markdown
- **WHEN** rendered Markdown contains a link to `javascript:alert(1)` and the user clicks it
- **THEN** nothing is executed and the route does not change

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
