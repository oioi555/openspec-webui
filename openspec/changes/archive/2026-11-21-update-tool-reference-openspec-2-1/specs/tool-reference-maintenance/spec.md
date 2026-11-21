## ADDED Requirements

### Requirement: Select the official supported-tools page by release line
For a caller-selected OpenSpec release `v2.0.0` or later, the maintenance workflow SHALL read the official supported-tools definitions from `docs-lab/reference/supported-tools.md` at that release. For earlier releases it SHALL read `docs/supported-tools.md`. The official dataset's source URL SHALL name the page that was actually read. Release-note reconciliation SHALL apply to whichever page is selected.

#### Scenario: Pin a 2.x release
- **WHEN** the caller selects `v2.1.1`
- **THEN** the workflow reads `docs-lab/reference/supported-tools.md` at `v2.1.1`
- **AND** the written official dataset's source URL points to that page

#### Scenario: Pin a 1.x release
- **WHEN** the caller selects `v1.14.0`
- **THEN** the workflow reads `docs/supported-tools.md` at `v1.14.0`

### Requirement: Maintain tool skill scope support from the bundled skills package
The maintenance workflow SHALL record, for each official tool id, whether the tool reads the universal `.agents/skills` folder, uses its own global skills folder (with that folder and any environment override), or has no global skills folder. The values SHALL come from the `skills` package version declared in the selected OpenSpec release's `package.json`, and the stored data SHALL carry that version. The dry-run diff SHALL report entry changes.

#### Scenario: Pin v2.1.1
- **WHEN** the caller selects `v2.1.1`, whose `package.json` declares `skills` `1.8.1`
- **THEN** the scope data is built from `skills@1.8.1`
- **AND** `eve` and `promptscript` are recorded as having no global skills folder

#### Scenario: A tool's global folder changes in a new release
- **WHEN** a later OpenSpec release bundles a `skills` version that changes a tool's global folder
- **THEN** the dry-run diff reports the changed folder for that tool id
- **AND** the packaged data changes only after the approved write
