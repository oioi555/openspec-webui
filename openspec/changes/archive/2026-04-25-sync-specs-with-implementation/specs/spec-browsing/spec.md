## MODIFIED Requirements

### Requirement: Spec list shows last modified date with icon
The system SHALL display each spec entry with a Calendar icon and the last modification date in locale-aware format (e.g., `Apr 10, 2026` for English, locale-equivalent for Japanese) using `Intl.DateTimeFormat` with `month: 'short'`, `day: 'numeric'`, and `year: 'numeric'`.

#### Scenario: Spec shows last modified date with calendar icon
- **WHEN** the Explorer Pane renders a spec with lastModified "2026-04-08"
- **THEN** the second line shows a Calendar icon followed by a locale-formatted date (e.g., "Apr 8, 2026" in English)

### Requirement: Catalog capability specs
The system SHALL discover capability directories under `specs/`, sort them alphabetically, and display them in the Explorer Pane's SPECS collapsible section.

#### Scenario: List available capabilities in Explorer
- **WHEN** the workspace contains one or more spec capability directories
- **THEN** the Explorer Pane's SPECS section lists them in alphabetical order
- **AND** each entry shows the capability name

#### Scenario: Show an empty spec list in Explorer
- **WHEN** the workspace contains no spec capability directories
- **THEN** the Explorer Pane's SPECS section shows `No specs found`
