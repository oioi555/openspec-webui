## ADDED Requirements

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
