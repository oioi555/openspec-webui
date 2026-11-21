## ADDED Requirements

### Requirement: Add-project directory list stays responsive for large folders
The add-project dialog SHALL list subdirectories that contain an `openspec/` folder before the other subdirectories, keeping name order inside each group. It SHALL offer a filter input that narrows the listed subdirectories by a case-insensitive name match without requesting the directory again. It SHALL render at most 200 matching entries at first and SHALL offer a control that reveals the remaining matches. Navigating to another directory SHALL clear the filter and reset the rendered limit.

#### Scenario: OpenSpec folders are listed first
- **WHEN** the displayed directory contains `alpha/`, `beta/` with an `openspec/` folder, and `gamma/`
- **THEN** the list shows `beta` first, followed by `alpha` and `gamma`

#### Scenario: Filter narrows the list
- **WHEN** the operator types `SCRATCH` into the filter while the displayed directory contains `scratchpad/` and `other/`
- **THEN** only `scratchpad` is listed
- **AND** no additional browse request is sent

#### Scenario: Large folder renders a bounded first page
- **WHEN** the displayed directory contains 931 subdirectories
- **THEN** the list renders 200 entries and a control that reveals the remaining 731
- **AND** activating the control renders all 931 entries

#### Scenario: Navigation resets filter and limit
- **WHEN** the operator has typed a filter or revealed all entries and then opens a subdirectory or goes up
- **THEN** the filter is empty and the rendered limit is 200 again
