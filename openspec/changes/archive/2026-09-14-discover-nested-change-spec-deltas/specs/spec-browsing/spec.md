## ADDED Requirements

### Requirement: Catalog change spec deltas
The system SHALL discover spec delta documents recursively under each change's `specs/` directory, matching nested `changes/<name>/specs/**/spec.md` files at any depth in addition to top-level `changes/<name>/specs/<capability>/spec.md` files. A directory that directly contains a `spec.md` file SHALL count as a spec delta whose capability identity is the path of that directory relative to the change's `specs/` directory, using `/` as the separator. A parent directory that contains only nested directories and no direct `spec.md` SHALL NOT be counted as a spec delta. The system SHALL tolerate deleted retired spec delta files by omitting them from discovery without errors. Discovered spec deltas SHALL be sorted alphabetically by capability identity, SHALL appear in the change's dedicated Spec Deltas UI, and SHALL be included in Explorer Pane and Dashboard spec delta counts. Spec deltas SHALL NOT be rendered as regular change file groups or Other Files.

#### Scenario: Discover nested change spec deltas
- **WHEN** a change contains a spec delta at `specs/network/auth/` so the full path is `openspec/changes/<name>/specs/network/auth/spec.md`
- **THEN** the parsed change includes that spec delta
- **AND** its capability identity is `network/auth`
- **AND** ChangeViewer Spec Deltas lists it with that capability identity

#### Scenario: Skip empty parent directories as spec deltas
- **WHEN** a change's `specs/network/` directory contains only nested directories and no direct `spec.md`
- **THEN** `network` is not counted as a spec delta
- **AND** deeper deltas that do contain a direct `spec.md` are still discovered

#### Scenario: Mix top-level and nested spec deltas
- **WHEN** a change contains both `specs/explorer-pane/spec.md` and `specs/network/auth/spec.md`
- **THEN** the change includes both spec deltas
- **AND** Explorer Pane and Dashboard spec delta counts equal `2`
- **AND** the Spec Deltas list is sorted alphabetically by capability identity as `explorer-pane` then `network/auth`

#### Scenario: Tolerate deleted retired spec delta files
- **WHEN** a spec delta file referenced by a previous scan no longer exists on disk
- **THEN** the system omits the deleted spec delta from discovery
- **AND** discovery continues without raising an error

#### Scenario: Nested spec deltas stay out of file groups and Other Files
- **WHEN** a change contains a nested spec delta at `specs/network/auth/spec.md` and a non-standard `notes.md` in the change root
- **THEN** selecting Spec Deltas shows the nested spec delta content
- **AND** the nested `spec.md` is not listed as a regular change file or an Other File

## MODIFIED Requirements

### Requirement: Change lastModified includes spec delta file updates
The system SHALL include markdown files under `changes/<name>/specs/` at any depth when computing a change's `lastModified`, so ExplorerPane and ChangeViewer surface the newest relevant change update even when only a spec delta file changed.

#### Scenario: Spec delta file is the newest file in a change
- **WHEN** a change's newest modified file is `changes/<name>/specs/<capability>/spec.md`
- **THEN** the parsed change `lastModified` equals that spec delta file's modification time
- **AND** the change still renders spec deltas in the dedicated UI area rather than the regular file groups

#### Scenario: Nested spec delta file is the newest file in a change
- **WHEN** a change's newest modified file is `changes/<name>/specs/network/auth/spec.md`
- **THEN** the parsed change `lastModified` equals that nested spec delta file's modification time
- **AND** the nested spec delta still renders in the dedicated Spec Deltas UI rather than the regular file groups
